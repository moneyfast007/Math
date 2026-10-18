import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '@/i18n';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer actions. */
  actions?: ReactNode;
}

let locks = 0;
let saved: { y: number; style: string } | null = null;

/**
 * Freezes the page behind an open dialog. iPhone Safari ignores overflow:
 * hidden on the body, so the body is pinned with position: fixed at its
 * current offset and put back (scroll position included) when the last
 * dialog closes. Counted, so a dialog over a dialog is fine.
 */
function lockPageScroll(): () => void {
  if (locks++ === 0) {
    const body = document.body;
    saved = { y: window.scrollY, style: body.getAttribute('style') ?? '' };
    Object.assign(body.style, {
      position: 'fixed',
      top: `-${saved.y}px`,
      left: '0',
      right: '0',
      overflow: 'hidden',
    });
  }
  return () => {
    if (--locks > 0 || !saved) return;
    const { y, style } = saved;
    saved = null;
    if (style) document.body.setAttribute('style', style);
    else document.body.removeAttribute('style');
    window.scrollTo(0, y);
  };
}

/**
 * Modal dialog. Escape and the close button dismiss it; focus moves into it on
 * open and returns to where it was on close. The page behind does not move
 * while it is open; a long body scrolls inside the dialog. Never uses the browser's own
 * alert/confirm, which look foreign on iPad and block the page.
 */
export function Dialog({ title, onClose, children, actions }: DialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = panel.current?.querySelector<HTMLElement>(
      'input, button:not([data-dialog-close]), [tabindex]:not([tabindex="-1"])',
    );
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    const unlock = lockPageScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
      previous?.focus();
    };
  }, []);

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="dialog__header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="btn btn--ghost dialog__close"
            onClick={onClose}
            aria-label={t('action.close')}
            data-dialog-close=""
          >
            ✕
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {actions ? <footer className="dialog__actions">{actions}</footer> : null}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            {t('action.cancel')}
          </button>
          <button type="button" className={danger ? 'btn btn--danger' : 'btn'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{body}</p>
    </Dialog>
  );
}
