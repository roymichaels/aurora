const STOP_WORDS = new Set([
  'the','is','a','an','and','or','but','if','to','of','in','on','for','with','as','by','at','from','this','that','it','are','was','were'
]);

export function validateAnswer(answer: string): boolean {
  const words = answer
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter((w) => w && !STOP_WORDS.has(w));
  return words.length >= 3;
}
