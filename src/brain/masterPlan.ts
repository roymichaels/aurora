/**
 * Structures and helpers for long-term planning.
 * Provides goal breakdowns, habit tracking and motivational triggers.
 */

export type TriggerType = 'email' | 'notification'

export interface MotivationalTrigger {
  /**
   * Delivery mechanism for the motivation.
   */
  type: TriggerType
  /**
   * Message to send when the trigger fires.
   */
  message: string
}

export interface Task {
  /**
   * Unique identifier for the task.
   */
  id: string
  /**
   * Human readable title.
   */
  title: string
  /**
   * Recurrence of the task.
   */
  frequency: 'daily' | 'weekly'
  /**
   * Optional motivational triggers attached to this task.
   */
  triggers?: MotivationalTrigger[]
}

export interface Goal {
  /**
   * Name of the goal.
   */
  name: string
  milestones: {
    /**
     * Annual milestones describing long term objectives.
     */
    annual: string[]
    /**
     * Quarterly milestones for shorter term progress.
     */
    quarterly: string[]
  }
  tasks: {
    /**
     * Tasks that should be performed every day.
     */
    daily: Task[]
    /**
     * Tasks that should be performed every week.
     */
    weekly: Task[]
  }
}

export interface HabitTrackerEntry {
  /**
   * Identifier of the task tracked.
   */
  taskId: string
  /**
   * ISO date string for when the task was attempted.
   */
  date: string
  /**
   * Whether the task was completed for the day/week.
   */
  completed: boolean
  /**
   * Current streak of consecutive completions.
   */
  streak: number
}

/**
 * Creates a new goal with milestones and tasks organised by cadence.
 */
export function createGoal (
  name: string,
  annualMilestones: string[],
  quarterlyMilestones: string[],
  dailyTasks: Task[],
  weeklyTasks: Task[]
): Goal {
  return {
    name,
    milestones: {
      annual: annualMilestones,
      quarterly: quarterlyMilestones
    },
    tasks: {
      daily: dailyTasks,
      weekly: weeklyTasks
    }
  }
}

const DAY = 1000 * 60 * 60 * 24

/**
 * Generates a habit tracker entry computing streaks based on history.
 */
export function createHabitEntry (
  task: Task,
  date: Date,
  completed: boolean,
  history: HabitTrackerEntry[] = []
): HabitTrackerEntry {
  let streak = 0

  if (completed) {
    const last = history
      .filter(entry => entry.taskId === task.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    if (last && last.completed) {
      const diffDays = Math.round((date.getTime() - new Date(last.date).getTime()) / DAY)
      const expected = task.frequency === 'daily' ? 1 : 7
      streak = diffDays === expected ? last.streak + 1 : 1
    } else {
      streak = 1
    }
  }

  return {
    taskId: task.id,
    date: date.toISOString(),
    completed,
    streak
  }
}

/**
 * Attaches a motivational trigger to a task.
 */
export function addTrigger (task: Task, trigger: MotivationalTrigger): void {
  if (!task.triggers) task.triggers = []
  task.triggers.push(trigger)
}

export interface MasterPlan {
  goals: Goal[]
}

export const masterPlan: MasterPlan = {
  goals: []
}

export default masterPlan

