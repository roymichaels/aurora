export type Scope = 'personal' | 'team' | 'organization';

export interface Mission {
  id: string;
  userId: string;
  scope: Scope;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  missionId: string;
  title: string;
  description?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPI {
  id: string;
  userId: string;
  goalId: string;
  name: string;
  target?: number;
  current?: number;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIRecord {
  id: string;
  userId: string;
  missionId: string;
  kpiId: string;
  value: number;
  recordedAt: Date;
  source?: string;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  userId: string;
  milestoneId: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  sprintId: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fact {
  id: string;
  userId: string;
  taskId: string;
  content: string;
  createdAt: Date;
}
