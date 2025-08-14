export type PhonemeTiming = {
  phoneme: string;
  start: number;
};

const LETTERS = /[a-z]/i;

/**
 * Very rough heuristic to break text into phoneme-like units and
 * generate estimated timing (ms) for each unit.
 * This is intentionally lightweight and does not attempt
 * linguistic accuracy. It simply spaces characters evenly
 * at a configurable rate.
 */
export function generatePhonemeTimings(text: string, rate = 12): number[] {
  const chars = text
    .toLowerCase()
    .split("")
    .filter((c) => LETTERS.test(c));
  const msPer = 1000 / rate;
  return chars.map((_, i) => i * msPer);
}
