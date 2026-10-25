import { useState } from 'react';
import type { Exercise } from '@/engine/types';
import { t } from '@/i18n';
import { MISTAKE_REASONS, type MistakeReason, type MistakeReport } from '@/sync/protocol';
import { Dialog } from './Dialog';

/**
 * "מצאתי טעות": a small flag in the corner of the exercise. The parent picks
 * what is wrong and the exercise itself is sent to the server (worker/stats.ts),
 * with nothing about the child or the device.
 */

const cut = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

export function mistakeReport(
  e: Exercise,
  given: number | null,
  reason: MistakeReason,
): MistakeReport {
  return {
    topic: cut(e.topicId, 60),
    level: e.level,
    fact: cut(e.factId, 120),
    display: cut(e.display, 200),
    spoken: cut(e.spokenText, 400),
    answer: e.answer,
    given,
    reason,
  };
}

export async function sendMistake(
  report: MistakeReport,
  send: (input: string, init: RequestInit) => Promise<Response> = (i, init) => fetch(i, init),
): Promise<boolean> {
  try {
    const res = await send('/api/mistake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ report }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function ReportMistake({ exercise, given }: { exercise: Exercise; given: number | null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<MistakeReason | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const close = () => {
    setOpen(false);
    setReason(null);
    setState('idle');
  };
  return (
    <>
      <button
        type="button"
        className="report-flag"
        aria-label={t('report.button')}
        title={t('report.button')}
        onClick={() => setOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
        </svg>
      </button>
      {open ? (
        <Dialog
          title={state === 'sent' ? t('report.thanks') : t('report.title')}
          onClose={close}
          actions={
            state === 'sent' ? (
              <button type="button" className="btn" onClick={close}>
                {t('report.done')}
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                disabled={reason === null || state === 'sending'}
                onClick={() => {
                  if (reason === null) return;
                  setState('sending');
                  void sendMistake(mistakeReport(exercise, given, reason)).then((ok) =>
                    setState(ok ? 'sent' : 'failed'),
                  );
                }}
              >
                {t('report.send')}
              </button>
            )
          }
        >
          {state === 'sent' ? (
            <p>{t('report.thanksBody')}</p>
          ) : (
            <div className="stack">
              <div className="report-reasons" role="radiogroup" aria-label={t('report.title')}>
                {MISTAKE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={reason === r}
                    className={reason === r ? 'report-reason report-reason--on' : 'report-reason'}
                    onClick={() => setReason(r)}
                  >
                    {t(`report.reason.${r}`)}
                  </button>
                ))}
              </div>
              <p className="muted">{t('report.privacy')}</p>
              {state === 'failed' ? (
                <p className="gate__error" role="alert">
                  {t('report.failed')}
                </p>
              ) : null}
            </div>
          )}
        </Dialog>
      ) : null}
    </>
  );
}
