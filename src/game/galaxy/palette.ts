export function milestoneColor(i: number): string {
  return `hsl(${(i * 137.508) % 360} 65% 58%)`;
}
