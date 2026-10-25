import { HOUR, bump, randomHex, sha256, sweepCounters, type KV } from './kit';
import type { CrashReport, MistakeReport } from '../src/sync/protocol';

/**
 * How many families use the app: anonymous counts, in one shared store (a
 * Durable Object in production), shown only on a page behind a secret key.
 *
 * Kept per family: a hash of its id (not the id), the first and the last day
 * it synced, how many children and in which grades, and whether it signs in
 * with an email. No names, no emails, no addresses. Per day: how many families
 * were created, were active, linked a device, signed in, set an email, and
 * tapped "I want the extended version". Families that never turned on sync
 * keep everything on their devices and are not counted.
 *
 * Also kept: exercises reported as wrong ("מצאתי טעות": the exercise and the
 * reason, nothing about the child or the device; the last 300), and the app's
 * own errors (the message and the place in the code, counted; the 100 most
 * recent). Both are limited per address with a counter that lasts a day.
 */

export interface FamilySummary {
  kids: number;
  grades: number[];
}

interface FamilyStat extends FamilySummary {
  first: string;
  last: string;
  account: boolean;
}

export interface DayStat {
  families: number;
  active: number;
  joins: number;
  logins: number;
  accounts: number;
  wants: number;
}

export type StatsEvent = 'join' | 'login' | 'account';

export interface StatsReport {
  today: string;
  families: number;
  activeToday: number;
  active7: number;
  active30: number;
  accounts: number;
  children: number;
  wants: number;
  /** Grade (0 = kindergarten … 6) → children. */
  grades: Record<string, number>;
  /** Children in the family → families. */
  kidsPerFamily: Record<string, number>;
  /** The last 30 days, newest first. */
  days: Array<{ day: string } & DayStat>;
  /** Of the families that started at least a week (a month) ago, how many came back after it. */
  retention: { week: { back: number; of: number }; month: { back: number; of: number } };
  /** Exercises reported as wrong, newest first (the last 50), and how many are kept. */
  mistakes: Array<MistakeReport & { day: string }>;
  mistakeCount: number;
  /** The app's errors, most recent first. */
  crashes: CrashStat[];
}

export interface CrashStat extends CrashReport {
  count: number;
  first: string;
  last: string;
}

export interface StatsApi {
  /** A family synced (or was created): counted active once a day. */
  active(familyId: string, summary: FamilySummary, created: boolean): Promise<void>;
  event(kind: StatsEvent): Promise<void>;
  setAccount(familyId: string, on: boolean): Promise<void>;
  /** One tap per device; false when this address tapped too often today. */
  want(id: string, address: string): Promise<boolean>;
  /** An exercise reported as wrong; false when this address reported too often today. */
  mistake(report: MistakeReport, address: string): Promise<boolean>;
  /** An error in the app, counted by message and place. */
  crash(report: CrashReport, address: string): Promise<boolean>;
  forget(familyId: string): Promise<void>;
  report(): Promise<StatsReport>;
}

/** The day in Israel, YYYY-MM-DD. */
export function dayOf(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ms);
}

const DAY = 24 * HOUR;
const WANTS_PER_ADDRESS = 5;
const MISTAKES_PER_ADDRESS = 20;
const CRASHES_PER_ADDRESS = 20;
const MISTAKES_KEPT = 300;
const CRASHES_KEPT = 100;

/** Whether a family that started on `first` was active again `days` days later or more. */
function cameBack(f: { first: string; last: string }, days: number): boolean {
  return f.last >= dayOf(Date.parse(`${f.first}T12:00:00Z`) + days * DAY);
}

function emptyDay(): DayStat {
  return { families: 0, active: 0, joins: 0, logins: 0, accounts: 0, wants: 0 };
}

export class StatsCore implements StatsApi {
  constructor(
    private readonly kv: KV,
    private readonly now: () => number = Date.now,
  ) {}

  private key(familyId: string): Promise<string> {
    return sha256(`stats:${familyId}`).then((h) => `fam:${h.slice(0, 32)}`);
  }

  private async add(field: keyof DayStat): Promise<void> {
    const key = `day:${dayOf(this.now())}`;
    const day = (await this.kv.get<DayStat>(key)) ?? emptyDay();
    day[field] += 1;
    await this.kv.put(key, day);
  }

  async active(familyId: string, summary: FamilySummary, created: boolean): Promise<void> {
    const today = dayOf(this.now());
    const key = await this.key(familyId);
    const current = await this.kv.get<FamilyStat>(key);
    const isNew = current === undefined;
    await this.kv.put<FamilyStat>(key, {
      first: current?.first ?? today,
      last: today,
      kids: summary.kids,
      grades: summary.grades,
      account: current?.account ?? false,
    });
    if (created || isNew) await this.add('families');
    if (current?.last !== today) await this.add('active');
  }

  async event(kind: StatsEvent): Promise<void> {
    await this.add(kind === 'join' ? 'joins' : kind === 'login' ? 'logins' : 'accounts');
  }

  async setAccount(familyId: string, on: boolean): Promise<void> {
    const key = await this.key(familyId);
    const current = await this.kv.get<FamilyStat>(key);
    if (current) await this.kv.put(key, { ...current, account: on });
  }

  async want(id: string, address: string): Promise<boolean> {
    const at = this.now();
    if (await this.kv.get(`want:${id}`)) return true;
    await sweepCounters(this.kv, ['wantip:'], at);
    if ((await bump(this.kv, `wantip:${address}`, DAY, at)) >= WANTS_PER_ADDRESS) return false;
    await this.kv.put(`want:${id}`, dayOf(at));
    await this.add('wants');
    return true;
  }

  async mistake(report: MistakeReport, address: string): Promise<boolean> {
    const at = this.now();
    await sweepCounters(this.kv, ['misip:'], at);
    if ((await bump(this.kv, `misip:${address}`, DAY, at)) >= MISTAKES_PER_ADDRESS) return false;
    await this.kv.put(`mis:${String(at).padStart(14, '0')}:${randomHex(3)}`, {
      ...report,
      day: dayOf(at),
    });
    const all = [...(await this.kv.list({ prefix: 'mis:' })).keys()].sort();
    for (const key of all.slice(0, Math.max(0, all.length - MISTAKES_KEPT))) {
      await this.kv.delete(key);
    }
    return true;
  }

  async crash(report: CrashReport, address: string): Promise<boolean> {
    const at = this.now();
    await sweepCounters(this.kv, ['crip:'], at);
    if ((await bump(this.kv, `crip:${address}`, DAY, at)) >= CRASHES_PER_ADDRESS) return false;
    const key = `crash:${(await sha256(`${report.message}\n${report.where}`)).slice(0, 24)}`;
    const today = dayOf(at);
    const current = await this.kv.get<CrashStat>(key);
    await this.kv.put<CrashStat>(key, {
      message: report.message,
      where: report.where,
      count: (current?.count ?? 0) + 1,
      first: current?.first ?? today,
      last: today,
    });
    if (!current) {
      const all = [...(await this.kv.list<CrashStat>({ prefix: 'crash:' })).entries()];
      if (all.length > CRASHES_KEPT) {
        all.sort(([, a], [, b]) => a.last.localeCompare(b.last));
        for (const [k] of all.slice(0, all.length - CRASHES_KEPT)) await this.kv.delete(k);
      }
    }
    return true;
  }

  async forget(familyId: string): Promise<void> {
    await this.kv.delete(await this.key(familyId));
  }

  async report(): Promise<StatsReport> {
    const at = this.now();
    const today = dayOf(at);
    const since = (days: number) => dayOf(at - (days - 1) * DAY);
    const d7 = since(7);
    const d30 = since(30);
    const families = [...(await this.kv.list<FamilyStat>({ prefix: 'fam:' })).values()];
    const grades: Record<string, number> = {};
    const kidsPerFamily: Record<string, number> = {};
    for (const f of families) {
      kidsPerFamily[f.kids] = (kidsPerFamily[f.kids] ?? 0) + 1;
      for (const g of f.grades) grades[g] = (grades[g] ?? 0) + 1;
    }
    const mistakes = await this.kv.list<MistakeReport & { day: string }>({ prefix: 'mis:' });
    const days: StatsReport['days'] = [];
    for (let i = 0; i < 30; i++) {
      const day = dayOf(at - i * DAY);
      days.push({ day, ...((await this.kv.get<DayStat>(`day:${day}`)) ?? emptyDay()) });
    }
    return {
      today,
      families: families.length,
      activeToday: families.filter((f) => f.last === today).length,
      active7: families.filter((f) => f.last >= d7).length,
      active30: families.filter((f) => f.last >= d30).length,
      accounts: families.filter((f) => f.account).length,
      children: families.reduce((n, f) => n + f.kids, 0),
      wants: (await this.kv.list({ prefix: 'want:' })).size,
      grades,
      kidsPerFamily,
      days,
      retention: {
        week: retention(families, 7, at),
        month: retention(families, 30, at),
      },
      mistakes: [...mistakes.entries()]
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, 50)
        .map(([, m]) => m),
      mistakeCount: mistakes.size,
      crashes: [...(await this.kv.list<CrashStat>({ prefix: 'crash:' })).values()]
        .sort((a, b) => b.last.localeCompare(a.last) || b.count - a.count)
        .slice(0, 30),
    };
  }
}

function retention(
  families: Array<{ first: string; last: string }>,
  days: number,
  at: number,
): { back: number; of: number } {
  const old = families.filter((f) => f.first <= dayOf(at - days * DAY));
  return { back: old.filter((f) => cameBack(f, days)).length, of: old.length };
}

/** Counts a family's children and their grades from its shared document. */
export function summarize(profiles: Record<string, { value: unknown }>): FamilySummary {
  const grades: number[] = [];
  for (const entry of Object.values(profiles)) {
    const p = entry.value as { grade?: unknown } | null;
    if (!p) continue;
    grades.push(typeof p.grade === 'number' ? p.grade : -1);
  }
  return { kids: grades.length, grades };
}

/* ---------- The page ---------- */

const GRADE_NAMES = ['גן', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];

function esc(text: string | number): string {
  return String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export function renderStats(r: StatsReport): string {
  const tile = (label: string, value: number) =>
    `<div class="tile"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const gradeRows = Object.entries(r.grades)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([g, n]) => `<tr><td>${esc(GRADE_NAMES[Number(g)] ?? '?')}</td><td>${esc(n)}</td></tr>`)
    .join('');
  const kidRows = Object.entries(r.kidsPerFamily)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, n]) => `<tr><td>${esc(k)}</td><td>${esc(n)}</td></tr>`)
    .join('');
  const dayRows = r.days
    .map(
      (d) =>
        `<tr><td dir="ltr">${esc(d.day)}</td><td>${esc(d.active)}</td><td>${esc(d.families)}</td><td>${esc(d.joins)}</td><td>${esc(d.accounts)}</td><td>${esc(d.logins)}</td><td>${esc(d.wants)}</td></tr>`,
    )
    .join('');
  const pct = (x: { back: number; of: number }) =>
    x.of === 0 ? '—' : `${Math.round((100 * x.back) / x.of)}% (${x.back} מתוך ${x.of})`;
  const REASONS: Record<string, string> = {
    answer: 'התשובה הנכונה שגויה',
    unclear: 'השאלה לא ברורה',
    visual: 'תמונה או הקראה',
    other: 'אחר',
  };
  const mistakeRows = r.mistakes
    .map(
      (m) =>
        `<tr><td dir="ltr">${esc(m.day)}</td><td>${esc(REASONS[m.reason] ?? m.reason)}</td><td dir="ltr">${esc(m.topic)} · ${esc(m.level)}</td><td dir="ltr">${esc(m.display || m.fact)}</td><td>${esc(m.spoken)}</td><td>${esc(m.answer)}</td><td>${esc(m.given ?? '—')}</td></tr>`,
    )
    .join('');
  const crashRows = r.crashes
    .map(
      (c) =>
        `<tr><td dir="ltr">${esc(c.last)}</td><td>${esc(c.count)}</td><td dir="ltr">${esc(c.message)}</td><td dir="ltr">${esc(c.where)}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>פלוסי · נתוני שימוש</title>
<style>
:root{color-scheme:light dark;--bg:#fbf6ee;--fg:#2b2622;--muted:#7a7068;--card:#fff;--line:#eadfce;--accent:#2f8f83}
@media (prefers-color-scheme:dark){:root{--bg:#1d1b19;--fg:#f3ece3;--muted:#a99f95;--card:#272421;--line:#3a3530}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
main{max-width:880px;margin:auto}h1{font-size:1.4rem;margin:0 0 4px}h2{font-size:1.1rem;margin:24px 0 8px}
.muted{color:var(--muted);font-size:.9rem}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px}
.tile b{display:block;font-size:1.6rem;color:var(--accent)}.tile span{color:var(--muted);font-size:.9rem}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}
th,td{padding:6px 10px;border-bottom:1px solid var(--line);text-align:right}th{font-weight:600}
.scroll{overflow-x:auto}
</style></head><body><main>
<h1>פלוסי · נתוני שימוש</h1>
<p class="muted">נכון ל־${esc(r.today)} (שעון ישראל). נספרות רק משפחות שהפעילו סנכרון או כניסה במייל; בלי שמות ובלי מיילים.</p>
<div class="tiles">
${tile('פעילות היום', r.activeToday)}${tile('פעילות ב־7 ימים', r.active7)}${tile('פעילות ב־30 ימים', r.active30)}
${tile('דיווחי טעות', r.mistakeCount)}${tile('משפחות בסך הכול', r.families)}${tile('ילדים', r.children)}${tile('עם מייל וסיסמה', r.accounts)}${tile('רוצים גרסה מורחבת', r.wants)}
</div>
<div class="two">
<div><h2>ילדים לפי כיתה</h2><table><tr><th>כיתה</th><th>ילדים</th></tr>${gradeRows || '<tr><td colspan="2">—</td></tr>'}</table></div>
<div><h2>ילדים במשפחה</h2><table><tr><th>ילדים</th><th>משפחות</th></tr>${kidRows || '<tr><td colspan="2">—</td></tr>'}</table></div>
</div>
<h2>חזרו לאפליקציה</h2>
<table><tr><th>אחרי שבוע</th><td>${esc(pct(r.retention.week))}</td></tr><tr><th>אחרי חודש</th><td>${esc(pct(r.retention.month))}</td></tr></table>
<p class="muted">מתוך המשפחות שהתחילו לפני שבוע (חודש) לפחות: כמה היו פעילות שוב שבוע (חודש) אחרי היום הראשון.</p>
<h2>30 הימים האחרונים</h2>
<div class="scroll"><table><tr><th>יום</th><th>פעילות</th><th>חדשות</th><th>מכשירים שחוברו</th><th>מיילים שהוגדרו</th><th>כניסות במייל</th><th>רוצים מורחבת</th></tr>${dayRows}</table></div>
<h2>דיווחים על טעויות בתרגילים</h2>
<div class="scroll"><table><tr><th>יום</th><th>סיבה</th><th>נושא · שלב</th><th>תרגיל</th><th>הנוסח</th><th>תשובה</th><th>הילד ענה</th></tr>${mistakeRows || '<tr><td colspan="7">אין דיווחים</td></tr>'}</table></div>
<h2>שגיאות באפליקציה</h2>
<div class="scroll"><table><tr><th>לאחרונה</th><th>פעמים</th><th>הודעה</th><th>איפה</th></tr>${crashRows || '<tr><td colspan="4">אין שגיאות</td></tr>'}</table></div>
</main></body></html>`;
}
