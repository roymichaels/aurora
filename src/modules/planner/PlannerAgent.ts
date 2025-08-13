export class PlannerAgent {
  plan(goal: string): string[] {
    const goalPhrase = goal.trim() || 'the goal';
    return [
      `Define what '${goalPhrase}' means to you`,
      'Break the outcome into actionable tasks',
      'Schedule time blocks for each task',
      'Review progress and adjust the plan',
    ];
  }
}
