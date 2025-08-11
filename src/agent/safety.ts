const PATTERNS = [
  { pattern: /(suicide|self-harm|kill myself)/i, issue: 'self-harm' },
  { pattern: /(violence|attack|terror|bomb)/i, issue: 'violence' },
  { pattern: /(hate speech|racial slur|bigot)/i, issue: 'hate' },
];

export interface SafetyResult {
  ok: boolean;
  issues: string[];
}

export function scanResponse(text: string): SafetyResult {
  const issues: string[] = [];
  for (const { pattern, issue } of PATTERNS) {
    if (pattern.test(text)) issues.push(issue);
  }
  return { ok: issues.length === 0, issues };
}

export function explainIssues(issues: string[]): string {
  return `Response blocked due to: ${issues.join(', ')}`;
}

export function safetyFilter(text: string): string {
  const { ok, issues } = scanResponse(text);
  return ok ? text : explainIssues(issues);
}

