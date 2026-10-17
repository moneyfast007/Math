import type { Visual } from '@/engine/types';
import { t } from '@/i18n';

/** Renders an exercise or hint picture. Always left-to-right, like the arithmetic. */
export function VisualView({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case 'objects':
      return <Objects v={visual} />;
    case 'numberLine':
      return <NumberLine v={visual} />;
    case 'fraction':
      return <Fraction v={visual} />;
    case 'array':
      return <ArrayDots v={visual} />;
    case 'rect':
      return <Rect v={visual} />;
    case 'placeValue':
      return <PlaceValue v={visual} />;
  }
}

function rowsOfFive(n: number): number[] {
  const rows: number[] = [];
  for (let left = n; left > 0; left -= 5) rows.push(Math.min(5, left));
  return rows;
}

function Objects({ v }: { v: Extract<Visual, { type: 'objects' }> }) {
  const removed = v.removed ?? 0;
  return (
    <div className="objects" dir="ltr" aria-hidden="true" data-visual="objects">
      {v.groups.map((count, g) => {
        // Crossed-out items are the last ones of the first group.
        const isRemoved = (i: number) => g === 0 && i >= count - removed;
        const kind = v.kinds?.[g] ?? v.kind;
        const items = Array.from({ length: count }, (_, i) => (
          <span key={i} className={isRemoved(i) ? 'obj obj--removed' : 'obj'}>
            {kind.emoji}
          </span>
        ));
        return (
          <div
            key={g}
            className={v.arranged ? 'objects__group objects__group--arranged' : 'objects__group'}
          >
            {v.arranged
              ? rowsOfFive(count).map((len, r) => (
                  <div key={r} className="objects__row">
                    {items.slice(r * 5, r * 5 + len)}
                  </div>
                ))
              : items}
          </div>
        );
      })}
    </div>
  );
}

function NumberLine({ v }: { v: Extract<Visual, { type: 'numberLine' }> }) {
  const step = v.step ?? 1;
  const unit = 40;
  const pad = 24;
  const n = Math.round((v.to - v.from) / step);
  const width = n * unit + pad * 2;
  const x = (k: number) => pad + ((k - v.from) / step) * unit;
  const baseY = 70;
  const hops = Array.from({ length: Math.abs(v.hops) }, (_, i) => {
    const dir = Math.sign(v.hops);
    return { from: v.start + dir * i * step, to: v.start + dir * (i + 1) * step };
  });

  return (
    <div className="numberline" dir="ltr" data-visual="numberLine">
      <svg
        viewBox={`0 0 ${width} 100`}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1={pad - 10} y1={baseY} x2={width - pad + 10} y2={baseY} className="nl-axis" />
        {Array.from({ length: n + 1 }, (_, i) => v.from + i * step).map((k) => (
          <g key={k}>
            <line
              x1={x(k)}
              y1={baseY - 7}
              x2={x(k)}
              y2={baseY + 7}
              className={k === v.stopAt ? 'nl-tick nl-tick--stop' : 'nl-tick'}
            />
            <text
              x={x(k)}
              y={baseY + 26}
              textAnchor="middle"
              className={k === v.stopAt ? 'nl-label nl-label--stop' : 'nl-label'}
            >
              {k}
            </text>
          </g>
        ))}
        {hops.map((h, i) => {
          const x1 = x(h.from);
          const x2 = x(h.to);
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${baseY - 4} Q ${mid} ${baseY - 40} ${x2} ${baseY - 4}`}
              className="nl-hop"
            />
          );
        })}
        <circle cx={x(v.start)} cy={baseY} r={8} className="nl-start" />
        {v.target !== undefined ? (
          <circle cx={x(v.target)} cy={baseY} r={8} className="nl-target" />
        ) : null}
      </svg>
    </div>
  );
}

function Fraction({ v }: { v: Extract<Visual, { type: 'fraction' }> }) {
  if (v.shape === 'circle') {
    const r = 46;
    const cx = 50;
    const cy = 50;
    const slices = Array.from({ length: v.parts }, (_, i) => {
      const a0 = (i / v.parts) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / v.parts) * 2 * Math.PI - Math.PI / 2;
      const large = v.parts === 1 ? 1 : 0;
      if (v.parts === 1)
        return `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
      return `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
    });
    return (
      <div className="fraction fraction--circle" dir="ltr" data-visual="fraction">
        <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
          {slices.map((d, i) => (
            <path
              key={i}
              d={d}
              className={i < v.shaded ? 'frac-cell frac-cell--on' : 'frac-cell'}
            />
          ))}
        </svg>
      </div>
    );
  }
  return (
    <div className="fraction fraction--bar" dir="ltr" data-visual="fraction" aria-hidden="true">
      {Array.from({ length: v.parts }, (_, i) => (
        <span key={i} className={i < v.shaded ? 'frac-cell frac-cell--on' : 'frac-cell'} />
      ))}
    </div>
  );
}

function ArrayDots({ v }: { v: Extract<Visual, { type: 'array' }> }) {
  return (
    <div
      className={v.squares ? 'dots dots--squares' : 'dots'}
      dir="ltr"
      data-visual="array"
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${v.cols}, auto)` }}
    >
      {Array.from({ length: v.rows * v.cols }, (_, i) => (
        <span key={i} className="dots__cell" />
      ))}
    </div>
  );
}

function Rect({ v }: { v: Extract<Visual, { type: 'rect' }> }) {
  const unit = v.unit ?? t('unit.cm');
  const scale = 160 / Math.max(v.width, v.height, 1);
  const w = Math.max(40, v.width * scale);
  const h = Math.max(40, v.height * scale);
  return (
    <div className="rect" dir="ltr" data-visual="rect">
      <svg viewBox={`0 0 ${w + 80} ${h + 60}`} role="img" aria-hidden="true">
        <rect x="40" y="20" width={w} height={h} className="rect__shape" />
        <text x={40 + w / 2} y={h + 50} textAnchor="middle" className="rect__label">
          {v.width} {unit}
        </text>
        <text
          x={w + 56}
          y={20 + h / 2}
          textAnchor="start"
          dominantBaseline="middle"
          className="rect__label"
        >
          {v.height} {unit}
        </text>
      </svg>
    </div>
  );
}

function PlaceValue({ v }: { v: Extract<Visual, { type: 'placeValue' }> }) {
  const digits = String(v.n).split('').map(Number);
  const names = [
    t('place.units'),
    t('place.tens'),
    t('place.hundreds'),
    t('place.thousands'),
    t('place.tenThousands'),
    t('place.hundredThousands'),
    t('place.millions'),
  ];
  return (
    <div className="place-value" dir="ltr" data-visual="placeValue" aria-hidden="true">
      {digits.map((d, i) => {
        const power = digits.length - 1 - i;
        return (
          <div key={i} className="place-value__col">
            <span className="place-value__digit">{d}</span>
            <span className="place-value__name">{names[power] ?? ''}</span>
            <span className="place-value__worth">{d * 10 ** power}</span>
          </div>
        );
      })}
    </div>
  );
}
