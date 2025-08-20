export type ActionScope = 'view' | 'task' | 'focus';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AgentAction<P = any, R = any> {
  /** Unique identifier, e.g. "view.open" */
  id: string;
  scope: ActionScope;
  description?: string;
  /** When true, dispatcher will ask the user for confirmation before running. */
  confirm?: boolean;
  /** XP reward to grant upon successful completion */
  reward?: number;
  run: (params: P) => Promise<ActionResult<R>>;
}
