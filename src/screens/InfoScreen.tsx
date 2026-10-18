import { Fragment, useEffect, type ReactNode } from 'react';
import { navigate } from '@/app/router';
import { t } from '@/i18n';
import { CONTACT_EMAIL, LEGAL_DOCS, LEGAL_UPDATED, LEGAL_WRITTEN } from '@/i18n/legal';
import { applyAgeBand } from '@/ui/ageBand';

/** The contact address inside a paragraph becomes a link. */
function withMail(text: string): ReactNode {
  const parts = text.split(CONTACT_EMAIL);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? (
        <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">
          {CONTACT_EMAIL}
        </a>
      ) : null}
    </Fragment>
  ));
}

/**
 * Accessibility statement, privacy policy and terms of use. Linked from the
 * home screen (a prominent place, as the accessibility regulations ask) and
 * from the parent area.
 */
export function InfoScreen() {
  useEffect(() => applyAgeBand('older'), []);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  const back = () => {
    if (window.history.length > 1) window.history.back();
    else navigate({ name: 'home' });
  };

  return (
    <main className="screen info" data-screen="info">
      <header className="screen__header">
        <h1>{t('info.title')}</h1>
        <button type="button" className="btn btn--secondary" onClick={back}>
          {t('action.back')}
        </button>
      </header>
      <nav aria-label={t('info.contents')} className="card info__nav">
        <ul>
          {LEGAL_DOCS.map((d) => (
            <li key={d.id}>
              <a href={`#${d.id}`}>{d.title}</a>
            </li>
          ))}
        </ul>
        <p className="muted">
          {t('info.dates', { params: { written: LEGAL_WRITTEN, updated: LEGAL_UPDATED } })}
        </p>
      </nav>
      {LEGAL_DOCS.map((doc) => (
        <article key={doc.id} id={doc.id} className="card stack info__doc" aria-labelledby={`${doc.id}-title`}>
          <h2 id={`${doc.id}-title`}>{doc.title}</h2>
          {doc.sections.map((s) => (
            <section key={s.heading} className="stack info__section">
              <h3>{s.heading}</h3>
              {s.paragraphs?.map((p) => <p key={p}>{withMail(p)}</p>)}
              {s.bullets ? (
                <ul>
                  {s.bullets.map((b) => (
                    <li key={b}>{withMail(b)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      ))}
    </main>
  );
}
