import { diffUserProfile, updatePlan } from '../updateEngine';
import { createGoal, createHabitEntry, addTrigger, Task, MasterPlan } from '../masterPlan';
import { UserProfile } from '@/data/profile';

// Helper to build goal structure mirroring generateGoalStructure
function buildGoal(name: string) {
  return createGoal(
    name,
    [`${name} annual milestone`],
    [`${name} quarterly milestone`],
    [
      { id: `${name}-daily`, title: `Daily progress for ${name}`, frequency: 'daily' },
    ],
    [
      { id: `${name}-weekly`, title: `Weekly review of ${name}`, frequency: 'weekly' },
    ],
  );
}

describe('diffUserProfile', () => {
  it('identifies added and removed goals and habits', () => {
    const oldProfile: UserProfile = {
      goals: 'Learn guitar\nRun marathon',
      habits: 'Meditate\nRead',
      history: [],
    };
    const newProfile: UserProfile = {
      goals: 'Learn guitar\nTravel the world',
      habits: 'Read\nWrite',
      history: [],
    };

    expect(diffUserProfile(oldProfile, newProfile)).toEqual({
      goals: { added: ['Travel the world'], removed: ['Run marathon'] },
      habits: { added: ['Write'], removed: ['Meditate'] },
    });
  });
});

describe('updatePlan', () => {
  it('applies profile diff and records version history', () => {
    const oldProfile: UserProfile = {
      goals: 'Learn guitar\nRun marathon',
      habits: 'Meditate\nRead',
      history: [],
    };
    const newProfile: UserProfile = {
      goals: 'Learn guitar\nTravel the world',
      habits: 'Read\nWrite',
      history: [],
    };

    const initialPlan: MasterPlan = {
      goals: [buildGoal('Learn guitar'), buildGoal('Run marathon')],
      habits: [
        { id: 'h1', title: 'Meditate', frequency: 'daily' },
        { id: 'h2', title: 'Read', frequency: 'daily' },
      ],
      plan_versions: [],
    };

    const updated = updatePlan(oldProfile, newProfile, initialPlan);

    // Goals updated
    expect(updated.goals.map((g) => g.name)).toEqual([
      'Learn guitar',
      'Travel the world',
    ]);
    const travelGoal = updated.goals.find((g) => g.name === 'Travel the world')!;
    expect(travelGoal.milestones.annual).toEqual([
      'Travel the world annual milestone',
    ]);
    expect(travelGoal.tasks.daily[0].title).toBe(
      'Daily progress for Travel the world',
    );
    expect(travelGoal.tasks.weekly[0].title).toBe(
      'Weekly review of Travel the world',
    );

    // Habits updated
    expect(updated.habits?.map((h) => h.title)).toEqual(['Read', 'Write']);

    // Version history includes snapshot of previous plan
    expect(updated.plan_versions).toHaveLength(1);
    expect(updated.plan_versions?.[0].goals.map((g) => g.name)).toEqual([
      'Learn guitar',
      'Run marathon',
    ]);
    expect(updated.plan_versions?.[0].habits?.map((h) => h.title)).toEqual([
      'Meditate',
      'Read',
    ]);
  });
});

describe('createHabitEntry', () => {
  it('calculates streaks for daily tasks', () => {
    const task: Task = { id: 't1', title: 'Meditate', frequency: 'daily' };
    const first = createHabitEntry(task, new Date('2024-01-01'), true, []);
    const second = createHabitEntry(task, new Date('2024-01-02'), true, [first]);
    const skipped = createHabitEntry(
      task,
      new Date('2024-01-04'),
      true,
      [first, second],
    );

    expect(first.streak).toBe(1);
    expect(second.streak).toBe(2);
    expect(skipped.streak).toBe(1);
  });

  it('calculates streaks for weekly tasks', () => {
    const task: Task = { id: 't2', title: 'Review', frequency: 'weekly' };
    const first = createHabitEntry(task, new Date('2024-01-01'), true, []);
    const second = createHabitEntry(task, new Date('2024-01-08'), true, [first]);

    expect(second.streak).toBe(2);
  });
});

describe('addTrigger', () => {
  it('attaches motivational triggers to tasks', () => {
    const task: Task = { id: 't1', title: 'Meditate', frequency: 'daily' };
    addTrigger(task, { type: 'email', message: 'Keep going!' });
    addTrigger(task, { type: 'notification', message: 'You rock!' });

    expect(task.triggers).toEqual([
      { type: 'email', message: 'Keep going!' },
      { type: 'notification', message: 'You rock!' },
    ]);
  });
});

