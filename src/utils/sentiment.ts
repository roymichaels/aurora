export function analyzeSentiment(text: string): number {
  const positive = ['good', 'great', 'happy', 'love', 'wonderful', 'excellent', 'fantastic', 'positive', 'amazing'];
  const negative = ['bad', 'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'negative', 'upset'];
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  for (const w of words) {
    if (positive.includes(w)) score++;
    if (negative.includes(w)) score--;
  }
  if (words.length === 0) return 0;
  const normalized = score / words.length;
  if (normalized > 1) return 1;
  if (normalized < -1) return -1;
  return normalized;
}
