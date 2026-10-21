import { t } from '@/i18n';

/**
 * Up to three stars: earned ones gold, the rest an outline. `size` 'lg' on the end of
 * a round (they pop in one by one), 'sm' under a station on the map.
 */
export function Stars({
  n,
  size = 'sm',
  label = true,
}: {
  n: number;
  size?: 'sm' | 'lg';
  /** Read the count to a screen reader (off where the text says it already). */
  label?: boolean;
}) {
  const name =
    n === 0 ? t('stars.none') : n === 1 ? t('stars.one') : t('stars.many', { params: { n } });
  return (
    <span
      className={`stars stars--${size}`}
      {...(label ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true })}
    >
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={i < n ? 'star star--on' : 'star'}
          style={{ animationDelay: `${0.15 + i * 0.25}s` }}
          aria-hidden="true"
        >
          <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
        </svg>
      ))}
    </span>
  );
}
