import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '@/i18n';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer actions. */
  actions?: ReactNode;
}

/**
 * Modal dialog. Escape and the close button dismiss it; focus moves into it on
 * open and returns to where it was on close. Never uses the browser's own
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
    return () => {
      document.removeEventListener('keydown', onKey);
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
          <button
            type="button"
            className={danger ? 'btn btn--danger' : 'btn'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{body}</p>
    </Dialog>
  );
}
