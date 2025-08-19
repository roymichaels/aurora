import { nanoid } from "nanoid";
import { Goal, Sprint, Task, useRoadmapStore } from "@/state/roadmapStore";

/**
 * Simple helper to build and mutate the local roadmap structure.
 * AI generation can later plug into proposeRoadmap to draft content.
 */
export class RoadmapBuilder {
  static proposeRoadmap(title = "My Goal"): Goal {
    return {
      id: `goal-${nanoid()}`,
      title,
      sprints: [],
    };
  }

  static addGoal(goal: Goal) {
    useRoadmapStore.getState().addGoal(goal);
  }

  static addSprint(goalId: string, title: string) {
    const sprint: Sprint = { id: `sprint-${nanoid()}`, title, tasks: [] };
    useRoadmapStore.getState().addSprint(goalId, sprint);
    return sprint;
  }

  static addTask(goalId: string, sprintId: string, title: string) {
    const task: Task = { id: `task-${nanoid()}`, title, status: "todo" };
    useRoadmapStore.getState().addTask(goalId, sprintId, task);
    return task;
  }

  static markTaskDone(taskId: string) {
    useRoadmapStore.getState().markTaskDone(taskId);
  }
}
