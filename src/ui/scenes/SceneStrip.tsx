import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { playCountdown, playLaunch, playSceneStep } from '@/ui/sounds';
import { SparkArt } from './companions';
import {
  Garden,
  gardenLayout,
  Race,
  raceLayout,
  TipiArt,
  type GardenLayout,
  type RaceLayout,
} from './moreScenes';
import {
  BubiArt,
  partsBuilt,
  Pond,
  pondLayout,
  Robot,
  robotLayout,
  type PondLayout,
  type RobotLayout,
} from './world3Scenes';
import {
  Balloons,
  balloonsLayout,
  Sub,
  subLayout,
  type BalloonsLayout,
  type SubLayout,
} from './world4Scenes';
import './scenes.css';

/**
 * The round's picture, at the top of the practice screen: every right answer
 * moves it one step, and the end of the round is its big moment.
 *
 * - The village (gan to grade 2): ניצוצית sends a spark and a lantern lights,
 *   with a window in the house under it. The end: the stars come out.
 * - The rocket (grades 3 to 6): a fuel cell fills and the rocket shakes; the
 *   end: a countdown and a launch.
 *
 * - The garden and the race (the second world of each): moreScenes.tsx.
 *
 * A wrong answer never takes anything back: ניצוצית tilts her head, or the
 * gauge blinks. An exercise whose answer was shown leaves its step dark.
 * Quiet (the parent's choice, or "reduce motion"): the steps just light.
 *
 * It is also the round's progress bar for assistive technology.
 */

export type SceneKind =
  'village' | 'rocket' | 'garden' | 'race' | 'pond' | 'robot' | 'balloons' | 'sub';

type Scene =
  | { kind: 'village'; l: VillageLayout }
  | { kind: 'rocket'; l: RocketLayout }
  | { kind: 'garden'; l: GardenLayout }
  | { kind: 'race'; l: RaceLayout }
  | { kind: 'pond'; l: PondLayout }
  | { kind: 'robot'; l: RobotLayout }
  | { kind: 'balloons'; l: BalloonsLayout }
  | { kind: 'sub'; l: SubLayout };

function makeScene(kind: SceneKind, size: Size, total: number): Scene {
  switch (kind) {
    case 'village':
      return { kind, l: villageLayout(size, total) };
    case 'rocket':
      return { kind, l: rocketLayout(size) };
    case 'garden':
      return { kind, l: gardenLayout(size, total) };
    case 'race':
      return { kind, l: raceLayout(size, total) };
    case 'pond':
      return { kind, l: pondLayout(size, total) };
    case 'robot':
      return { kind, l: robotLayout(size) };
    case 'balloons':
      return { kind, l: balloonsLayout(size, total) };
    case 'sub':
      return { kind, l: subLayout(size, total) };
  }
}

/** The scenes whose end is a ride (a countdown, or just the drive off). */
const RIDES: readonly SceneKind[] = ['rocket', 'race'];

interface Props {
  kind: SceneKind;
  /** Exercises in the round. */
  total: number;
  /** One per finished exercise: lit (answered) or dark (its answer was shown). */
  marks: readonly boolean[];
  /** Grows with every wrong try: the scene reacts. */
  nudge?: number;
  quiet: boolean;
  /** The end of the round: play the big moment once. */
  finale?: boolean;
  /** For the progress bar role. */
  label: string;
  /** Exercises done (for the progress bar role). */
  done: number;
}

interface Size {
  w: number;
  h: number;
}

export function SceneStrip({
  kind,
  total,
  marks,
  nudge = 0,
  quiet,
  finale = false,
  label,
  done,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  // Steps lit on screen (behind marks while a step animates in).
  const [shown, setShown] = useState(marks.length);
  const [popping, setPopping] = useState<number | null>(null);
  const [reacting, setReacting] = useState(0);
  // The fish is in the air (drawn on the canvas), not in its place.
  const [away, setAway] = useState(false);
  const [phase, setPhase] = useState<'still' | 'count3' | 'count2' | 'count1' | 'launch' | 'done'>(
    'still',
  );
  const canvas = useRef<HTMLCanvasElement>(null);
  const buddy = useRef<HTMLDivElement>(null);
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !size) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [size]);

  const scene = size ? makeScene(kind, size, total) : null;

  // A new mark: animate it in, then show it lit.
  useEffect(() => {
    if (marks.length <= shown) {
      if (marks.length < shown) setShown(marks.length);
      return;
    }
    const i = marks.length - 1;
    const lit = marks[i] === true;
    if (!lit || quiet || !scene) {
      setShown(marks.length);
      if (lit && !quiet) playSceneStep(kind, i);
      return;
    }
    playSceneStep(kind, i);
    let cancelled = false;
    const ctx = canvas.current?.getContext('2d') ?? null;
    const show = () => {
      setShown(marks.length);
      setPopping(i);
    };
    const run = async () => {
      if (!ctx) return show();
      switch (scene.kind) {
        case 'village': {
          const lamp = scene.l.lamps[i];
          if (!lamp) return show();
          const from = scene.l.spark;
          const y = lamp.y + lamp.s * 0.6;
          await animate(ctx, 260, (t) => drawBolt(ctx, from.x, from.y, lamp.x, y, 1 - t * 0.4));
          if (cancelled || !live.current) return;
          show();
          await animate(ctx, 420, (t) => drawBurst(ctx, lamp.x, y, t, i, '#ffe27a'));
          return;
        }
        case 'garden': {
          const spot = scene.l.spots[i];
          if (!spot) return show();
          const from = scene.l.spout;
          await animate(ctx, 380, (t) => drawDrops(ctx, from.x, from.y, spot.x, spot.y - 4, t));
          if (cancelled || !live.current) return;
          show();
          await animate(ctx, 360, (t) => drawBurst(ctx, spot.x, spot.y - 4, t, i, '#7cc9f5'));
          return;
        }
        case 'rocket':
          show();
          await animate(ctx, 420, (t) => drawPuff(ctx, scene.l.rx, scene.l.base, t, 50, 8, i));
          return;
        case 'race': {
          show();
          const x = scene.l.markers[i] ?? scene.l.finish;
          const y = scene.l.road + scene.l.laneH * 0.5;
          await animate(ctx, 450, (t) => drawSpeedLines(ctx, x + scene.l.car * 0.6, y, t, i));
          return;
        }
        case 'pond': {
          const pad = scene.l.pads[i];
          if (!pad) return show();
          const from = scene.l.from;
          setAway(true);
          await animate(ctx, 520, (t) => drawJump(ctx, from.x, from.y, pad.x, pad.y - 6, t));
          if (cancelled || !live.current) return;
          setAway(false);
          show();
          await animate(ctx, 420, (t) => drawRipple(ctx, pad.x, pad.y + 2, t));
          return;
        }
        case 'robot': {
          const before = partsBuilt(litBefore(marks, i), total);
          const after = partsBuilt(litBefore(marks, i) + 1, total);
          const part = scene.l.parts[after - 1];
          if (after > before && part) {
            await animate(ctx, 300, (t) => drawScan(ctx, part.x, part.y + part.h * t, part.w));
            if (cancelled || !live.current) return;
          }
          setShown(marks.length);
          setPopping(after - 1);
          return;
        }
        case 'balloons': {
          const spot = scene.l.spots[i];
          if (!spot) return show();
          await animate(ctx, 360, (t) => drawGather(ctx, spot.x, spot.y, spot.r, t));
          if (cancelled || !live.current) return;
          show();
          return;
        }
        case 'sub': {
          show();
          const to = scene.l.path[i + 1];
          if (!to) return;
          await animate(ctx, 520, (t) => drawSonar(ctx, to.x, to.y, t));
          return;
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      setShown(marks.length);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks.length]);

  // A wrong try: a small reaction, nothing taken back.
  useEffect(() => {
    if (nudge === 0 || quiet) return;
    setReacting((n) => n + 1);
  }, [nudge, quiet]);

  // The end of the round.
  useEffect(() => {
    if (!finale) return;
    if (quiet || !RIDES.includes(kind)) {
      setPhase('done');
      return;
    }
    let cancelled = false;
    const ctx = canvas.current?.getContext('2d') ?? null;
    const run = async () => {
      await sleep(350);
      if (kind === 'race') {
        // The car crosses the line and drives off.
        setPhase('launch');
        playSceneStep('race', 17);
        await sleep(1200);
        if (!cancelled) setPhase('done');
        return;
      }
      for (const p of ['count3', 'count2', 'count1'] as const) {
        if (cancelled) return;
        setPhase(p);
        playCountdown();
        await sleep(480);
      }
      if (cancelled) return;
      setPhase('launch');
      playLaunch();
      if (ctx && scene?.kind === 'rocket') {
        const { rx, base } = scene.l;
        void animate(ctx, 1500, (t) => drawPuff(ctx, rx, base, t, 170, 26, 99));
      }
      await sleep(1500);
      if (!cancelled) setPhase('done');
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finale, size !== null]);

  const counting =
    phase === 'count3' ? '3' : phase === 'count2' ? '2' : phase === 'count1' ? '1' : '';

  return (
    <div
      ref={box}
      className={[
        'scene-strip',
        `scene-strip--${kind}`,
        phase === 'done' ? 'scene-strip--done' : '',
        phase === 'launch' ? 'scene-strip--launch' : '',
        quiet ? 'scene-strip--quiet' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={label}
      data-lit={marks.filter(Boolean).length}
    >
      {scene && size ? (
        scene.kind === 'village' ? (
          <Village
            size={size}
            layout={scene.l}
            marks={marks}
            shown={shown}
            popping={popping}
            reacting={reacting}
            buddyRef={buddy}
          />
        ) : scene.kind === 'rocket' ? (
          <Rocket
            size={size}
            layout={scene.l}
            total={total}
            marks={marks}
            shown={shown}
            popping={popping}
            reacting={reacting}
          />
        ) : scene.kind === 'garden' ? (
          <>
            <Garden size={size} layout={scene.l} marks={marks} shown={shown} popping={popping} />
            <div
              key={reacting}
              className={reacting > 0 ? 'village__buddy village__buddy--tilt' : 'village__buddy'}
              style={{ width: scene.l.buddy, height: scene.l.buddy }}
              aria-hidden="true"
            >
              <TipiArt size="100%" />
            </div>
          </>
        ) : scene.kind === 'race' ? (
          <Race size={size} layout={scene.l} marks={marks} shown={shown} />
        ) : scene.kind === 'pond' ? (
          <>
            <Pond size={size} layout={scene.l} marks={marks} shown={shown} popping={popping} />
            <div
              key={reacting}
              className={[
                'pond__fish',
                reacting > 0 ? 'village__buddy--tilt' : '',
                away ? 'pond__fish--away' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                width: scene.l.fish,
                height: scene.l.fish,
                top: scene.l.from.y - scene.l.fish / 2,
              }}
              aria-hidden="true"
            >
              <BubiArt size="100%" />
            </div>
          </>
        ) : scene.kind === 'balloons' ? (
          <Balloons
            size={size}
            layout={scene.l}
            marks={marks}
            shown={shown}
            popping={popping}
            reacting={reacting}
          />
        ) : scene.kind === 'sub' ? (
          <Sub size={size} layout={scene.l} marks={marks} shown={shown} reacting={reacting} />
        ) : (
          <div key={`r${reacting}`} className={reacting > 0 ? 'robot robot--warn' : 'robot'}>
            <Robot
              size={size}
              layout={scene.l}
              built={partsBuilt(litBefore(marks, shown), total)}
              flashing={popping}
              counter={`${litBefore(marks, shown)}/${total}`}
            />
          </div>
        )
      ) : null}
      <canvas ref={canvas} className="scene-strip__fx" aria-hidden="true" />
      {counting ? (
        <span className="scene-strip__count" aria-hidden="true">
          {counting}
        </span>
      ) : null}
    </div>
  );
}

/* ---------- The village ---------- */

interface VillageLayout {
  lamps: { x: number; y: number; s: number }[];
  string: string;
  houses: { d: string; win: { x: number; y: number } | null }[];
  spark: { x: number; y: number };
  buddy: number;
  stars: { x: number; y: number }[];
}

function villageLayout({ w, h }: Size, total: number): VillageLayout {
  const buddy = Math.round(Math.min(64, h * 0.46));
  const x0 = w - buddy - 10;
  const x1 = 14;
  const y0 = h * 0.24;
  const sag = h * 0.16;
  const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y0 + sag * 4 * t * (1 - t) });
  const spacing = (x0 - x1) / Math.max(total, 1);
  const s = Math.max(7, Math.min(15, spacing * 0.62));
  const lamps = Array.from({ length: total }, (_, i) => ({ ...at((i + 0.5) / total), s }));
  let d = '';
  for (let i = 0; i <= 30; i++) {
    const p = at(i / 30);
    d += `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  // One house under every lantern (its window lights with it), and plain ones at both ends.
  const houses: VillageLayout['houses'] = [];
  const house = (cx: number, hw: number, hh: number, win: boolean) => {
    const x = cx - hw / 2;
    const y = h - hh;
    const roof = Math.min(10, hh * 0.35);
    houses.push({
      d: `M${x} ${h}V${y}l${hw / 2} ${-roof}l${hw / 2} ${roof}V${h}z`,
      win: win ? { x: cx, y: y + hh * 0.3 } : null,
    });
  };
  const unit = Math.max(spacing, 16);
  lamps.forEach((l, i) =>
    house(l.x, unit * (0.85 + (i % 3) * 0.12), h * (0.2 + ((i * 7) % 3) * 0.04), true),
  );
  house(x0 + unit * 0.6, unit * 1.2, h * 0.19, false);
  house(x0 + unit * 1.7, unit, h * 0.26, false);
  house(w - unit * 0.3, unit * 1.1, h * 0.21, false);
  house(x1 - unit * 0.4, unit, h * 0.2, false);
  const stars = Array.from({ length: 18 }, (_, i) => ({
    x: ((i * 37) % 100) / 100,
    y: (((i * 53) % 40) / 100) * 1,
  }));
  return { lamps, string: d, houses, spark: { x: w - buddy * 0.75, y: buddy * 0.6 }, buddy, stars };
}

function Village({
  size,
  layout,
  marks,
  shown,
  popping,
  reacting,
  buddyRef,
}: {
  size: Size;
  layout: VillageLayout;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
  reacting: number;
  buddyRef: RefObject<HTMLDivElement | null>;
}) {
  const lit = (i: number) => i < shown && marks[i] === true;
  const winSize = Math.max(4, Math.min(8, layout.lamps[0]?.s ?? 8) * 0.6);
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        {layout.stars.map((st, i) => (
          <circle key={i} className="sky-star" cx={st.x * size.w} cy={st.y * size.h + 4} r="1.4" />
        ))}
        <path d={layout.string} className="village__string" />
        {layout.houses.map((hs, i) => (
          <path key={i} d={hs.d} className="village__house" />
        ))}
        {layout.lamps.map((_lamp, i) => {
          const win = layout.houses[i]?.win;
          return win ? (
            <rect
              key={`w${i}`}
              className={lit(i) ? 'village__window village__window--on' : 'village__window'}
              x={win.x - winSize / 2}
              y={win.y}
              width={winSize}
              height={winSize * 1.1}
              rx="1.5"
            />
          ) : null;
        })}
        {layout.lamps.map((l, i) => (
          <g
            key={`l${i}`}
            className={[
              'village__lamp',
              lit(i) ? 'village__lamp--on' : '',
              i < shown && marks[i] === false ? 'village__lamp--missed' : '',
              popping === i && lit(i) ? 'village__lamp--pop' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ transformOrigin: `${l.x}px ${l.y}px` }}
          >
            <rect
              x={l.x - l.s * 0.35}
              y={l.y - 1}
              width={l.s * 0.7}
              height={l.s * 0.35}
              rx="1.5"
              className="village__cap"
            />
            <rect
              x={l.x - l.s / 2}
              y={l.y + l.s * 0.25}
              width={l.s}
              height={l.s * 1.15}
              rx={l.s * 0.42}
              className="village__glass"
            />
          </g>
        ))}
      </svg>
      <div
        ref={buddyRef}
        key={reacting}
        className={reacting > 0 ? 'village__buddy village__buddy--tilt' : 'village__buddy'}
        style={{ width: layout.buddy, height: layout.buddy }}
        aria-hidden="true"
      >
        <SparkArt size="100%" />
      </div>
    </>
  );
}

/* ---------- The rocket ---------- */

interface RocketLayout {
  rx: number;
  base: number;
  rh: number;
  rw: number;
  gauge: { right: number; top: number; bottom: number; width: number };
  stars: { x: number; y: number }[];
}

function rocketLayout({ w, h }: Size): RocketLayout {
  const base = h - 8;
  const rh = h * 0.7;
  const rw = rh * 0.3;
  return {
    rx: Math.round(w * 0.42),
    base,
    rh,
    rw,
    gauge: {
      right: Math.round(w * 0.12),
      top: 8,
      bottom: 8,
      width: Math.max(16, Math.min(22, h * 0.17)),
    },
    stars: Array.from({ length: 22 }, (_, i) => ({
      x: ((i * 37) % 100) / 100,
      y: ((i * 53) % 70) / 100,
    })),
  };
}

function Rocket({
  size,
  layout,
  total,
  marks,
  shown,
  popping,
  reacting,
}: {
  size: Size;
  layout: RocketLayout;
  total: number;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
  reacting: number;
}) {
  const { rx, base, rh, rw } = layout;
  const top = base - rh;
  const body = rh * 0.78;
  const nose = rh * 0.22;
  const fin = rw * 0.75;
  const tower = rx + rw * 1.6;
  const lit = (i: number) => i < shown && marks[i] === true;
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        {layout.stars.map((st, i) => (
          <circle key={i} className="sky-star" cx={st.x * size.w} cy={st.y * size.h + 4} r="1.3" />
        ))}
        <rect x="0" y={base + 3} width={size.w} height={size.h - base} className="rocket__ground" />
        <g className="rocket__tower">
          <path d={`M${tower} ${base}V${top + 6}M${tower + rw * 0.6} ${base}V${top + 6}`} />
          {Array.from({ length: 5 }, (_, i) => {
            const y = base - ((base - top - 6) / 5) * i;
            const y2 = base - ((base - top - 6) / 5) * (i + 1);
            return <path key={i} d={`M${tower} ${y}L${tower + rw * 0.6} ${y2}`} />;
          })}
          <path d={`M${tower} ${top + body * 0.45}H${rx + rw / 2}`} />
        </g>
        <rect x={rx - rw * 1.4} y={base} width={rw * 2.8} height="3" className="rocket__pad" />
        <g
          className={popping !== null ? 'rocket__body rocket__body--shake' : 'rocket__body'}
          key={`b${shown}`}
        >
          <g className="rocket__flame">
            <path
              d={`M${rx - rw * 0.3} ${base - 3}q${rw * 0.3} ${rh * 0.45} ${rw * 0.6} 0z`}
              fill="#ff9a3c"
            />
            <path
              d={`M${rx - rw * 0.16} ${base - 3}q${rw * 0.16} ${rh * 0.28} ${rw * 0.32} 0z`}
              fill="#ffe27a"
            />
          </g>
          <path
            d={`M${rx - rw / 2} ${base - body * 0.25}l${-fin} ${fin}v${-fin * 1.6}l${fin} ${-fin}z`}
            fill="#e24b4b"
          />
          <path
            d={`M${rx + rw / 2} ${base - body * 0.25}l${fin} ${fin}v${-fin * 1.6}l${-fin} ${-fin}z`}
            fill="#e24b4b"
          />
          <path
            d={`M${rx - rw / 2} ${base - 2}V${top + nose}q${rw / 2} ${-nose * 1.5} ${rw} 0V${base - 2}z`}
            fill="#eef1fb"
            stroke="#9aa6d4"
            strokeWidth="1.5"
          />
          <path
            d={`M${rx - rw / 2} ${top + nose}q${rw / 2} ${-nose * 1.5} ${rw} 0z`}
            fill="#e24b4b"
          />
          <circle
            cx={rx}
            cy={top + nose + body * 0.28}
            r={rw * 0.32}
            fill="#0f1736"
            stroke="#9aa6d4"
            strokeWidth="2"
          />
          <rect
            x={rx - rw * 0.2}
            y={top + nose + body * 0.25}
            width={rw * 0.4}
            height={rw * 0.14}
            rx={rw * 0.07}
            fill="#34e0d0"
          />
        </g>
      </svg>
      <div
        key={`g${reacting}`}
        className={reacting > 0 ? 'rocket__gauge rocket__gauge--warn' : 'rocket__gauge'}
        style={{
          right: layout.gauge.right,
          top: layout.gauge.top,
          bottom: layout.gauge.bottom,
          width: layout.gauge.width,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              lit(i) ? 'on' : '',
              lit(i) && i >= total - 3 ? 'hot' : '',
              popping === i && lit(i) ? 'flash' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- Drawing ---------- */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function animate(
  ctx: CanvasRenderingContext2D,
  ms: number,
  draw: (t: number) => void,
): Promise<void> {
  const t0 = performance.now();
  return new Promise((done) => {
    const frame = (now: number) => {
      const t = (now - t0) / ms;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (t >= 1) {
        done();
        return;
      }
      draw(t);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/** A seeded wobble, so a bolt or a puff looks alive without Math.random (steady in tests). */
function wobble(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  alpha: number,
) {
  const seed = performance.now() / 40;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#fff3a8';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffd45c';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    ctx.lineTo(
      x0 + (x1 - x0) * t + wobble(seed + i) * 14,
      y0 + (y1 - y0) * t + wobble(seed - i) * 14,
    );
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

function drawBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  seed: number,
  color: string,
) {
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + wobble(seed * 31 + i);
    const v = 1.6 + (wobble(seed * 17 + i) + 0.5) * 2.2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * v * t * 16, y + Math.sin(a) * v * t * 16, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPuff(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  spread: number,
  n: number,
  seed: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.6 * (1 - t);
  ctx.fillStyle = '#c7cde6';
  for (let i = 0; i < n; i++) {
    const dx = wobble(seed * 13 + i) * spread;
    const dy = (wobble(seed * 7 + i) + 0.5) * 10;
    const r = 3 + (wobble(seed * 3 + i) + 0.5) * 5;
    ctx.beginPath();
    ctx.arc(x + dx * t, y - dy * t, r * (1 + t), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** טיפי's water: a few drops flying in an arc to the seed. */
function drawDrops(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  t: number,
) {
  ctx.save();
  ctx.fillStyle = '#7cc9f5';
  for (let k = 0; k < 5; k++) {
    const p = Math.max(0, Math.min(1, t * 1.25 - k * 0.06));
    if (p <= 0 || p >= 1) continue;
    const x = x0 + (x1 - x0) * p;
    const y = y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * 26;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Speed lines behind the car as it moves on. */
function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  seed: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.8 * (1 - t);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const dy = (k - 1.5) * 6 + wobble(seed * 5 + k) * 3;
    const len = 14 + (wobble(seed * 9 + k) + 0.5) * 14;
    ctx.beginPath();
    ctx.moveTo(x + 4 + t * 10, y + dy);
    ctx.lineTo(x + 4 + t * 10 + len, y + dy);
    ctx.stroke();
  }
  ctx.restore();
}

/** Right answers among the first `n` finished exercises. */
function litBefore(marks: readonly boolean[], n: number): number {
  let lit = 0;
  for (let i = 0; i < Math.min(n, marks.length); i++) if (marks[i] === true) lit++;
  return lit;
}

/** בועי in mid-air: a small fish flying in an arc to the pad. */
function drawJump(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  t: number,
) {
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 40;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((t - 0.5) * 1.4);
  ctx.fillStyle = '#ffb547';
  ctx.strokeStyle = '#d96b1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(15, -5);
  ctx.lineTo(15, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRipple(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = '#e8fbff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 6 + t * 16, 2 + t * 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** The workbench scanner building a part of בולט. */
function drawScan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save();
  ctx.strokeStyle = '#34e0d0';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#34e0d0';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + w + 4, y);
  ctx.stroke();
  ctx.restore();
}

/** Little puffs of air gathering into a new balloon. */
function drawGather(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  ctx.fillStyle = 'rgb(255 255 255 / 85%)';
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05 + t * 2;
    const d = (r + 9) * (1 - t);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The sonar ping: a ring spreading from the submarine. */
function drawSonar(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = '#bfe9ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 6 + t * 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
