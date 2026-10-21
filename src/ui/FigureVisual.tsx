import type { Visual } from '@/engine/types';
import './figure.css';

/**
 * A picture drawn from parts (worlds "מצולעים" and "מצולעים, זוויות ומדידה"):
 * shapes that make a house or a rocket, lines straight, curved and broken, half
 * a shape beside its line of symmetry, shapes on squared paper. Plain SVG in
 * the figure's own box, left to right like the arithmetic.
 */
export function FigureView({ v }: { v: Extract<Visual, { type: 'figure' }> }) {
  const pad = Math.max(v.w, v.h) * 0.04;
  const box = `${-pad} ${-pad} ${v.w + pad * 2} ${v.h + pad * 2}`;
  const paper: number[][] = [];
  if (v.paper) {
    for (let x = 0; x <= v.w; x++) paper.push([x, 0, x, v.h]);
    for (let y = 0; y <= v.h; y++) paper.push([0, y, v.w, y]);
  }
  return (
    <div
      className={v.paper ? 'geo figure figure--paper' : 'geo figure'}
      dir="ltr"
      data-visual="figure"
      aria-hidden="true"
    >
      {/* Strokes keep their width in pixels (figure.css), whatever the box's units. */}
      <svg viewBox={box} className="geo__svg figure__svg">
        {paper.map(([x1, y1, x2, y2], i) => (
          <line key={`p${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className="figure__paper" />
        ))}
        {v.parts.map((p, i) => (
          <path
            key={i}
            d={p.d}
            className={
              p.line
                ? `figure__line figure__line--${p.color ?? 'plain'}`
                : `figure__part figure__part--${p.color ?? 'plain'}`
            }
          />
        ))}
        {v.axis !== undefined ? (
          <line x1={v.axis} y1={-pad} x2={v.axis} y2={v.h + pad} className="figure__axis" />
        ) : null}
      </svg>
    </div>
  );
}
