/** Fisher-Yates shuffle — returns a new array, never mutates the original. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick `count` random items from `array` (without replacement). */
export function pickRandom<T>(array: readonly T[], count: number): T[] {
  return shuffle(array).slice(0, count);
}
