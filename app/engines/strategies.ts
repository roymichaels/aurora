import { KPI, Milestone, Scope } from '../types/mission.ts';

// Reusable template types deriving from mission types
export type KPITemplate = Pick<KPI, 'name' | 'unit' | 'target'>;
export type MilestoneTemplate = Pick<Milestone, 'title' | 'description'>;

export interface Strategy {
  id: string;
  title: string;
  scope: Scope;
  milestones: MilestoneTemplate[];
  kpis: KPITemplate[];
}

const strategies: Strategy[] = [
  {
    id: 'wealth',
    title: 'Wealth Engine',
    scope: 'organization',
    milestones: [
      { title: 'Define irresistible offer' },
      { title: 'Launch acquisition funnel' },
      { title: 'Scale to $10k monthly revenue' },
    ],
    kpis: [
      { name: 'Monthly Revenue', unit: 'USD', target: 10000 },
      { name: 'Leads Generated', unit: 'count', target: 100 },
    ],
  },
  {
    id: 'hypnosis',
    title: 'Hypnosis Practice',
    scope: 'personal',
    milestones: [
      { title: 'Draft personalized script' },
      { title: 'Record induction track' },
      { title: 'Daily self‑hypnosis session' },
    ],
    kpis: [
      { name: 'Sessions per Week', unit: 'sessions', target: 5 },
      { name: 'Average Session Minutes', unit: 'minutes', target: 20 },
    ],
  },
  {
    id: 'content',
    title: 'Content Machine',
    scope: 'team',
    milestones: [
      { title: 'Plan editorial calendar' },
      { title: 'Publish first three pieces' },
      { title: 'Launch newsletter' },
    ],
    kpis: [
      { name: 'Posts per Week', unit: 'posts', target: 3 },
      { name: 'Email Subscribers', unit: 'people', target: 1000 },
    ],
  },
  {
    id: 'systems',
    title: 'Systems Automation',
    scope: 'organization',
    milestones: [
      { title: 'Document core processes' },
      { title: 'Automate repetitive tasks' },
      { title: 'Set up monitoring dashboard' },
    ],
    kpis: [
      { name: 'Automated Tasks', unit: 'percent', target: 50 },
      { name: 'Process Docs Created', unit: 'docs', target: 10 },
    ],
  },
];

export function pickStrategies(scopes: Scope[]): Strategy[] {
  const set = new Set(scopes);
  return strategies.filter(s => set.has(s.scope));
}

export default pickStrategies;

