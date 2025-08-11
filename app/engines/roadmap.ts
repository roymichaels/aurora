// Utility types and helpers to construct a simple roadmap.
// Avoid Node-specific APIs so this file can be imported in
// both Node and Deno environments (e.g. Supabase Edge Functions).

export interface Milestone {
  label: string;
  start: string;
  end: string;
  acceptance: string;
}

export interface Sprint {
  start: string;
  end: string;
}

export interface Task {
  id: string;
  title: string;
}

export function cryptoId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function planQuarters(start: Date, end: Date): { label: string; start: Date; end: Date }[] {
  const quarters: { label: string; start: Date; end: Date }[] = [];
  const current = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);

  while (current <= end) {
    const qStart = new Date(current);
    const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
    const label = `Q${Math.floor(qStart.getMonth() / 3) + 1} ${qStart.getFullYear()}`;
    quarters.push({ label, start: qStart, end: qEnd });
    current.setMonth(current.getMonth() + 3);
  }

  return quarters;
}

export function acceptanceFor(strategy: string, label: string): string {
  return `${strategy} ${label}`;
}

export function makeSprint(start: Date, lengthDays: number): Sprint {
  const end = new Date(start);
  end.setDate(end.getDate() + lengthDays);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function seedTasks(strategy: string): Task[] {
  return [
    { id: cryptoId(), title: `${strategy} kickoff` },
    { id: cryptoId(), title: `${strategy} review` },
  ];
}

export function buildRoadmap(
  deadlineISO: string,
  strategy: string,
  sprintLenDays: number,
): { milestones: Milestone[]; sprints: Sprint[]; tasks: Task[] } {
  const now = new Date();
  const deadline = new Date(deadlineISO);

  const milestones = planQuarters(now, deadline).map(q => ({
    label: q.label,
    start: q.start.toISOString(),
    end: q.end.toISOString(),
    acceptance: acceptanceFor(strategy, q.label),
  }));

  const sprints: Sprint[] = [];
  let cursor = new Date(now);
  while (cursor < deadline) {
    const sprint = makeSprint(cursor, sprintLenDays);
    sprints.push(sprint);
    cursor = new Date(sprint.end);
  }

  const tasks = seedTasks(strategy);

  return { milestones, sprints, tasks };
}

