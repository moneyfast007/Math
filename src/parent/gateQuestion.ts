/**
 * The arithmetic question at the parent gate: a two-digit number (not a round
 * ten) times a digit from 6 to 9, e.g. 47 × 6. Quick for an adult, out of reach
 * for the younger children. A child in grade 4 can solve it, which is why the
 * parent screen recommends setting a PIN.
 */
export interface GateQuestion {
  a: number;
  b: number;
  answer: number;
}

/** `rng` returns a float in [0, 1), like Math.random. */
export function makeGateQuestion(rng: () => number): GateQuestion {
  let a = 13 + Math.floor(rng() * 87); // 13–99
  if (a % 10 === 0) a += 1;
  if (a > 99) a = 99;
  const b = 6 + Math.floor(rng() * 4); // 6–9
  return { a, b, answer: a * b };
}
