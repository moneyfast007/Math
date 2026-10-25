import type { Grade } from '@/ui/ageBand';
import { TipiArt, TurboArt } from './moreScenes';
import { BoltArt, BubiArt } from './world3Scenes';
import { DubiArt, EchoArt } from './world4Scenes';
import { TotoArt, TzukiArt } from './world5Scenes';
import { AnaniArt, DrakiArt, KaftoriArt, MenofiArt, NovaArt, ShokiArt } from './laterScenes';
import type { SceneKind } from './SceneStrip';
import './scenes.css';

/**
 * The friends a child collects: one for each world of her grade, by its place
 * (the first world's friend, the second's...). The little ones (gan to grade 2)
 * and the older ones (grades 3 to 6) have friends of their own, matching the
 * scene they practise in (src/ui/scenes/SceneStrip.tsx).
 *
 * Every place has its friend and its scene (eight worlds at most in a grade).
 */

export type CompanionId =
  | 'spark'
  | 'cosmo'
  | 'tipi'
  | 'turbo'
  | 'bubi'
  | 'bolt'
  | 'dubi'
  | 'echo'
  | 'toto'
  | 'tzuki'
  | 'kaftori'
  | 'anani'
  | 'shoki'
  | 'menofi'
  | 'nova'
  | 'draki';

export interface Companion {
  id: CompanionId;
  /** Grammatical gender of the name, for "joined" lines. */
  gender: 'f' | 'm';
}

export type SceneStyle = 'young' | 'older';

export function sceneStyleForGrade(grade: Grade): SceneStyle {
  return grade <= 2 ? 'young' : 'older';
}

/** By world place (0-based), for each style. */
const SLOTS: Record<SceneStyle, readonly (Companion | null)[]> = {
  young: [
    { id: 'spark', gender: 'f' },
    { id: 'tipi', gender: 'f' },
    { id: 'bubi', gender: 'm' },
    { id: 'dubi', gender: 'm' },
    { id: 'toto', gender: 'm' },
    { id: 'kaftori', gender: 'm' },
    { id: 'anani', gender: 'm' },
    { id: 'shoki', gender: 'm' },
  ],
  older: [
    { id: 'cosmo', gender: 'm' },
    { id: 'turbo', gender: 'm' },
    { id: 'bolt', gender: 'm' },
    { id: 'echo', gender: 'm' },
    { id: 'tzuki', gender: 'm' },
    { id: 'menofi', gender: 'm' },
    { id: 'nova', gender: 'f' },
    { id: 'draki', gender: 'm' },
  ],
};

/** The practice scene of a world, by its place: each drawn place has its own, the rest the first. */
const SCENES: Record<SceneStyle, readonly SceneKind[]> = {
  young: ['village', 'garden', 'pond', 'balloons', 'train', 'snowman', 'rainbow', 'cake'],
  older: ['rocket', 'race', 'robot', 'sub', 'mountain', 'tower', 'stars', 'egg'],
};

export function sceneForWorld(style: SceneStyle, slot: number): SceneKind {
  return SCENES[style][slot] ?? SCENES[style][0] ?? 'village';
}

export function companionFor(style: SceneStyle, slot: number): Companion | null {
  return SLOTS[style][slot] ?? null;
}

/** ניצוצית: a little spark with a lightning tuft. */
export function SparkArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M54 4 38 30h12L42 46l22-28H52z"
        fill="#ffd45c"
        stroke="#e0a21a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="64" rx="30" ry="28" fill="#ffe27a" stroke="#e0a21a" strokeWidth="3" />
      <ellipse cx="40" cy="56" rx="8" ry="6" fill="#fff6c9" opacity="0.8" />
      <circle cx="40" cy="64" r="5.5" fill="#fff" />
      <circle cx="60" cy="64" r="5.5" fill="#fff" />
      <circle cx="41" cy="65" r="3" fill="#2b2320" />
      <circle cx="61" cy="65" r="3" fill="#2b2320" />
      <path
        d="M43 76q7 6 14 0"
        stroke="#2b2320"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="31" cy="73" r="3.5" fill="#f4a3a8" />
      <circle cx="69" cy="73" r="3.5" fill="#f4a3a8" />
    </svg>
  );
}

/** קוסמו: the rocket's robot pilot. */
export function CosmoArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="47" y="6" width="6" height="14" rx="3" fill="#7d8bc4" />
      <circle cx="50" cy="6" r="5" fill="#34e0d0" />
      <rect
        x="16"
        y="20"
        width="68"
        height="58"
        rx="18"
        fill="#dfe5f7"
        stroke="#33437f"
        strokeWidth="3"
      />
      <rect x="24" y="32" width="52" height="28" rx="12" fill="#0f1736" />
      <rect x="31" y="41" width="14" height="8" rx="4" fill="#34e0d0" />
      <rect x="55" y="41" width="14" height="8" rx="4" fill="#34e0d0" />
      <rect x="30" y="80" width="40" height="14" rx="6" fill="#9aa6d4" />
    </svg>
  );
}

export function CompanionArt({ id, size }: { id: CompanionId; size: number | string }) {
  switch (id) {
    case 'spark':
      return <SparkArt size={size} />;
    case 'cosmo':
      return <CosmoArt size={size} />;
    case 'tipi':
      return <TipiArt size={size} />;
    case 'turbo':
      return <TurboArt size={size} />;
    case 'bubi':
      return <BubiArt size={size} />;
    case 'bolt':
      return <BoltArt size={size} />;
    case 'dubi':
      return <DubiArt size={size} />;
    case 'echo':
      return <EchoArt size={size} />;
    case 'toto':
      return <TotoArt size={size} />;
    case 'tzuki':
      return <TzukiArt size={size} />;
    case 'kaftori':
      return <KaftoriArt size={size} />;
    case 'anani':
      return <AnaniArt size={size} />;
    case 'shoki':
      return <ShokiArt size={size} />;
    case 'menofi':
      return <MenofiArt size={size} />;
    case 'nova':
      return <NovaArt size={size} />;
    case 'draki':
      return <DrakiArt size={size} />;
  }
}
