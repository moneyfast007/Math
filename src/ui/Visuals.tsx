import type { Visual } from '@/engine/types';

/** Renders an exercise or hint picture. Always left-to-right, like the arithmetic. */
export function VisualView({ visual }: { visual: Visual }) {
  return visual.type === 'objects' ? <Objects v={visual} /> : <NumberLine v={visual} />;
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
        const items = Array.from({ length: count }, (_, i) => (
          <span key={i} className={isRemoved(i) ? 'obj obj--removed' : 'obj'}>
            {v.kind.emoji}
          </span>
        ));
        return (
          <div key={g} className={v.arranged ? 'objects__group objects__group--arranged' : 'objects__group'}>
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
  const unit = 40;
  const pad = 24;
  const n = v.to - v.from;
  const width = n * unit + pad * 2;
  const x = (k: number) => pad + (k - v.from) * unit;
  const baseY = 70;
  const hops = Array.from({ length: Math.abs(v.hops) }, (_, i) => {
    const dir = Math.sign(v.hops);
    return { from: v.start + dir * i, to: v.start + dir * (i + 1) };
  });

  return (
    <div className="numberline" dir="ltr" data-visual="numberLine">
      <svg viewBox={`0 0 ${width} 100`} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <line x1={pad - 10} y1={baseY} x2={width - pad + 10} y2={baseY} className="nl-axis" />
        {Array.from({ length: n + 1 }, (_, i) => v.from + i).map((k) => (
          <g key={k}>
            <line x1={x(k)} y1={baseY - 7} x2={x(k)} y2={baseY + 7} className={k === v.stopAt ? 'nl-tick nl-tick--stop' : 'nl-tick'} />
            <text x={x(k)} y={baseY + 26} textAnchor="middle" className={k === v.stopAt ? 'nl-label nl-label--stop' : 'nl-label'}>
              {k}
            </text>
          </g>
        ))}
        {hops.map((h, i) => {
          const x1 = x(h.from);
          const x2 = x(h.to);
          const mid = (x1 + x2) / 2;
          return (
            <path key={i} d={`M ${x1} ${baseY - 4} Q ${mid} ${baseY - 40} ${x2} ${baseY - 4}`} className="nl-hop" />
          );
        })}
        <circle cx={x(v.start)} cy={baseY} r={8} className="nl-start" />
        {v.target !== undefined ? <circle cx={x(v.target)} cy={baseY} r={8} className="nl-target" /> : null}
      </svg>
    </div>
  );
}
