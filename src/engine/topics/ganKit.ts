import { shown } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import { exercise, pictureChoices, type AdviceSpec, type Said } from '../build';
import { shuffle } from '../rng';
import type { Exercise, Hint, Rng, SceneItem, ShapeItem, Visual } from '../types';

/**
 * What the gan worlds "מרחב ומיקום" and "מיון והשוואה" share: the things they
 * draw (an emoji with its Hebrew name and gender) and an exercise whose answers
 * are pictures. Nothing to read: the question is spoken, the buttons are pictures.
 */

export interface Thing extends Noun {
  id: string;
  emoji: string;
}

const th = (
  id: string,
  emoji: string,
  singular: string,
  plural: string,
  gender: Gender,
): Thing => ({
  id,
  emoji,
  singular,
  plural,
  gender,
});

/** Every thing the two worlds draw, by id. Emoji whose colour and look are the same on every phone. */
export const THINGS = {
  // Animals (head emoji, facing the child: a queue reads the same either way).
  dog: th('dog', '🐶', 'כלב', 'כלבים', 'm'),
  cat: th('cat', '🐱', 'חתול', 'חתולים', 'm'),
  rabbit: th('rabbit', '🐰', 'ארנב', 'ארנבים', 'm'),
  bear: th('bear', '🐻', 'דוב', 'דובים', 'm'),
  monkey: th('monkey', '🐵', 'קוף', 'קופים', 'm'),
  fox: th('fox', '🦊', 'שועל', 'שועלים', 'm'),
  lion: th('lion', '🦁', 'אריה', 'אריות', 'm'),
  tiger: th('tiger', '🐯', 'נמר', 'נמרים', 'm'),
  pig: th('pig', '🐷', 'חזיר', 'חזירים', 'm'),
  mouse: th('mouse', '🐭', 'עכבר', 'עכברים', 'm'),
  frog: th('frog', '🐸', 'צפרדע', 'צפרדעים', 'f'),
  bee: th('bee', '🐝', 'דבורה', 'דבורים', 'f'),
  bird: th('bird', '🐦', 'ציפור', 'ציפורים', 'f'),
  butterfly: th('butterfly', '🦋', 'פרפר', 'פרפרים', 'm'),
  chick: th('chick', '🐥', 'אפרוח', 'אפרוחים', 'm'),
  turtle: th('turtle', '🐢', 'צב', 'צבים', 'm'),
  whale: th('whale', '🐳', 'לווייתן', 'לווייתנים', 'm'),
  dino: th('dino', '🦖', 'דינוזאור', 'דינוזאורים', 'm'),
  duck: th('duck', '🦆', 'ברווז', 'ברווזים', 'm'),
  baby: th('baby', '👶', 'תינוק', 'תינוקות', 'm'),
  // Toys and things.
  teddy: th('teddy', '🧸', 'דובי', 'דובים', 'm'),
  ball: th('ball', '⚽', 'כדור', 'כדורים', 'm'),
  car: th('car', '🚗', 'מכונית', 'מכוניות', 'f'),
  drum: th('drum', '🥁', 'תוף', 'תופים', 'm'),
  book: th('book', '📕', 'ספר', 'ספרים', 'm'),
  robot: th('robot', '🤖', 'רובוט', 'רובוטים', 'm'),
  gift: th('gift', '🎁', 'מתנה', 'מתנות', 'f'),
  balloon: th('balloon', '🎈', 'בלון', 'בלונים', 'm'),
  kite: th('kite', '🪁', 'עפיפון', 'עפיפונים', 'm'),
  star: th('star', '⭐', 'כוכב', 'כוכבים', 'm'),
  heart: th('heart', '❤️', 'לב', 'לבבות', 'm'),
  drop: th('drop', '💧', 'טיפה', 'טיפות', 'f'),
  cap: th('cap', '🧢', 'כובע', 'כובעים', 'm'),
  key: th('key', '🔑', 'מפתח', 'מפתחות', 'm'),
  lock: th('lock', '🔒', 'מנעול', 'מנעולים', 'm'),
  umbrella: th('umbrella', '☂️', 'מטרייה', 'מטריות', 'f'),
  rain: th('rain', '🌧️', 'גשם', 'גשמים', 'm'),
  bottle: th('bottle', '🍼', 'בקבוק', 'בקבוקים', 'm'),
  spoon: th('spoon', '🥄', 'כפית', 'כפיות', 'f'),
  bowl: th('bowl', '🥣', 'קערה', 'קערות', 'f'),
  bone: th('bone', '🦴', 'עצם', 'עצמות', 'f'),
  // Clothes.
  shirt: th('shirt', '👕', 'חולצה', 'חולצות', 'f'),
  jeans: th('jeans', '👖', 'מכנסיים', 'מכנסיים', 'm'),
  sock: th('sock', '🧦', 'גרב', 'גרביים', 'm'),
  dress: th('dress', '👗', 'שמלה', 'שמלות', 'f'),
  shoe: th('shoe', '👟', 'נעל', 'נעליים', 'f'),
  glove: th('glove', '🧤', 'כפפה', 'כפפות', 'f'),
  // Vehicles.
  bus: th('bus', '🚌', 'אוטובוס', 'אוטובוסים', 'm'),
  bike: th('bike', '🚲', 'אופניים', 'אופניים', 'm'),
  plane: th('plane', '✈️', 'מטוס', 'מטוסים', 'm'),
  boat: th('boat', '⛵', 'סירה', 'סירות', 'f'),
  rocket: th('rocket', '🚀', 'חללית', 'חלליות', 'f'),
  tractor: th('tractor', '🚜', 'טרקטור', 'טרקטורים', 'm'),
  // Food and plants.
  apple: th('apple', '🍎', 'תפוח', 'תפוחים', 'm'),
  banana: th('banana', '🍌', 'בננה', 'בננות', 'f'),
  grapes: th('grapes', '🍇', 'ענבים', 'ענבים', 'm'),
  pear: th('pear', '🍐', 'אגס', 'אגסים', 'm'),
  strawberry: th('strawberry', '🍓', 'תות', 'תותים', 'm'),
  orange: th('orange', '🍊', 'תפוז', 'תפוזים', 'm'),
  lemon: th('lemon', '🍋', 'לימון', 'לימונים', 'm'),
  cherries: th('cherries', '🍒', 'דובדבנים', 'דובדבנים', 'm'),
  tomato: th('tomato', '🍅', 'עגבנייה', 'עגבניות', 'f'),
  blueberries: th('blueberries', '🫐', 'אוכמניות', 'אוכמניות', 'f'),
  broccoli: th('broccoli', '🥦', 'ברוקולי', 'ברוקולי', 'm'),
  cucumber: th('cucumber', '🥒', 'מלפפון', 'מלפפונים', 'm'),
  carrot: th('carrot', '🥕', 'גזר', 'גזרים', 'm'),
  corn: th('corn', '🌽', 'תירס', 'תירסים', 'm'),
  cheese: th('cheese', '🧀', 'גבינה', 'גבינות', 'f'),
  clover: th('clover', '🍀', 'תלתן', 'תלתנים', 'm'),
  sunflower: th('sunflower', '🌻', 'חמנייה', 'חמניות', 'f'),
  flower: th('flower', '🌸', 'פרח', 'פרחים', 'm'),
  tree: th('tree', '🌳', 'עץ', 'עצים', 'm'),
  // Places.
  house: th('house', '🏠', 'בית', 'בתים', 'm'),
  tent: th('tent', '⛺', 'אוהל', 'אוהלים', 'm'),
  castle: th('castle', '🏰', 'ארמון', 'ארמונות', 'm'),
  icecream: th('icecream', '🍦', 'גלידה', 'גלידות', 'f'),
  carousel: th('carousel', '🎠', 'קרוסלה', 'קרוסלות', 'f'),
} as const satisfies Record<string, Thing>;

export type ThingId = keyof typeof THINGS;

export const thing = (id: ThingId): Thing => THINGS[id];
export const things = (ids: readonly ThingId[]): Thing[] => ids.map(thing);

/** An answer button: one thing, alone in a square (`size`: how big in it, out of 20). */
export function icon(t: Thing, size = 16): Visual {
  return {
    type: 'scene',
    w: 20,
    h: 20,
    icon: true,
    items: [{ emoji: t.emoji, x: 10, y: 10, size }],
  };
}

/** An answer button: one flat shape. */
export function shapeIcon(shape: ShapeItem): Visual {
  return { type: 'scene', w: 20, h: 20, icon: true, items: [{ shape, x: 10, y: 10, size: 16 }] };
}

/** A scene item: a thing at x, y. */
export const at = (t: Thing, x: number, y: number, size?: number): SceneItem =>
  size === undefined ? { emoji: t.emoji, x, y } : { emoji: t.emoji, x, y, size };

/** Evenly spread x positions for `n` things across a board `w` wide, from the right (Hebrew order). */
export function spread(n: number, w: number, margin = 14): number[] {
  if (n === 1) return [w / 2];
  const step = (w - 2 * margin) / (n - 1);
  return Array.from({ length: n }, (_, i) => w - margin - i * step);
}

export interface PictureOption {
  label: string;
  visual: Visual;
}

export interface PictureQuestion {
  topicId: string;
  level: number;
  factId: string;
  spoken: Said;
  visual?: Visual;
  /** The right answer first, then the others. */
  options: [PictureOption, ...PictureOption[]];
  hints: [Hint, Hint, Hint];
  solution: Said;
  /** Advice for a wrong option, by its place in `options` (1, 2, ...). */
  advice?: { option: number; say: Said }[];
  diagnose?: Exercise['diagnose'];
}

/** A question answered by tapping a picture; the buttons in an order of chance. */
export function pictureQuestion(q: PictureQuestion, rng: Rng): Exercise {
  const order = shuffle(
    rng,
    q.options.map((_, i) => i),
  );
  const advice: AdviceSpec[] = (q.advice ?? []).map((a) => ({
    value: order.indexOf(a.option),
    say: a.say,
  }));
  return exercise({
    factId: q.factId,
    topicId: q.topicId,
    level: q.level,
    prompt: shown(q.spoken),
    display: '',
    spoken: q.spoken,
    ...(q.visual ? { visual: q.visual } : {}),
    answer: order.indexOf(0),
    input: pictureChoices(
      order.map((i) => (q.options[i] as PictureOption).label),
      order.map((i) => (q.options[i] as PictureOption).visual),
    ),
    hints: q.hints,
    solution: q.solution,
    ...(advice.length > 0 ? { advice } : {}),
    ...(q.diagnose ? { diagnose: q.diagnose } : {}),
  });
}

/** A thing as an answer button, named by its name. */
export const thingOption = (t: Thing, size?: number): PictureOption => ({
  label: t.singular,
  visual: icon(t, size),
});

/** The colours of the shapes world, by name (a colour said after a masculine noun, and in plural). */
export const COLOR_WORD = {
  red: { m: 'אדום', pl: 'אדומים' },
  blue: { m: 'כחול', pl: 'כחולים' },
  yellow: { m: 'צהוב', pl: 'צהובים' },
  green: { m: 'ירוק', pl: 'ירוקים' },
} as const;
