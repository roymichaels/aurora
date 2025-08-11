export type Priors = {
  arpu: number;
  closeRate: number;
  leadToCall: number;
  postToLead: number;
  hoursPerWeek: number;
};

export const priors: Priors = {
  arpu: 1000,
  closeRate: 0.25,
  leadToCall: 0.5,
  postToLead: 0.1,
  hoursPerWeek: 20,
};

function monthsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const diff = years * 12 + months;
  return diff < 0 ? 0 : diff;
}

export interface MonthlyTarget {
  month: string;
  revenue: number;
}

export function deriveRevenueTargets(
  totalRevenue: number,
  start: Date,
  end: Date,
): MonthlyTarget[] {
  const months = monthsBetween(start, end);
  if (months <= 0) return [];

  const perMonth = totalRevenue / months;
  const result: MonthlyTarget[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    result.push({ month: monthDate.toISOString().slice(0, 7), revenue: perMonth });
  }

  return result;
}

export interface FunnelOutput {
  revenue: number;
  deals: number;
  calls: number;
  leads: number;
  posts: number;
}

export function funnelBacksolve(
  monthlyRevenue: number,
  prior: Priors = priors,
): FunnelOutput {
  const deals = monthlyRevenue / prior.arpu;
  const calls = deals / prior.closeRate;
  const leads = calls / prior.leadToCall;
  const posts = leads / prior.postToLead;

  return {
    revenue: monthlyRevenue,
    deals,
    calls,
    leads,
    posts,
  };
}

