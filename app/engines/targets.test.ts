import { deriveRevenueTargets, funnelBacksolve, priors } from './targets';

describe('deriveRevenueTargets', () => {
  it('distributes revenue across months', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-04-01');
    const targets = deriveRevenueTargets(12000, start, end);

    expect(targets).toHaveLength(3);
    expect(targets.map(t => t.month)).toEqual(['2024-01', '2024-02', '2024-03']);
    targets.forEach(t => expect(t.revenue).toBeCloseTo(4000));
  });
});

describe('funnelBacksolve', () => {
  it('calculates funnel stages from revenue', () => {
    const result = funnelBacksolve(5000, priors);
    expect(result.deals).toBeCloseTo(5);
    expect(result.calls).toBeCloseTo(20);
    expect(result.leads).toBeCloseTo(40);
    expect(result.posts).toBeCloseTo(400);
  });
});

