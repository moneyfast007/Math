import { HOUR, bump, sha256, sweepCounters, type KV } from './kit';

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
}

export interface StatsApi {
  /** A family synced (or was created): counted active once a day. */
  active(familyId: string, summary: FamilySummary, created: boolean): Promise<void>;
  event(kind: StatsEvent): Promise<void>;
  setAccount(familyId: string, on: boolean): Promise<void>;
  /** One tap per device; false when this address tapped too often today. */
  want(id: string, address: string): Promise<boolean>;
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
    };
  }
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
${tile('משפחות בסך הכול', r.families)}${tile('ילדים', r.children)}${tile('עם מייל וסיסמה', r.accounts)}${tile('רוצים גרסה מורחבת', r.wants)}
</div>
<div class="two">
<div><h2>ילדים לפי כיתה</h2><table><tr><th>כיתה</th><th>ילדים</th></tr>${gradeRows || '<tr><td colspan="2">—</td></tr>'}</table></div>
<div><h2>ילדים במשפחה</h2><table><tr><th>ילדים</th><th>משפחות</th></tr>${kidRows || '<tr><td colspan="2">—</td></tr>'}</table></div>
</div>
<h2>30 הימים האחרונים</h2>
<div class="scroll"><table><tr><th>יום</th><th>פעילות</th><th>חדשות</th><th>מכשירים שחוברו</th><th>מיילים שהוגדרו</th><th>כניסות במייל</th><th>רוצים מורחבת</th></tr>${dayRows}</table></div>
</main></body></html>`;
}
