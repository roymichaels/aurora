import { buildRoadmap, planQuarters } from './roadmap';

describe('planQuarters', () => {
  it('labels quarters between start and end', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const quarters = planQuarters(start, end);
    expect(quarters.map(q => q.label)).toEqual([
      'Q1 2024',
      'Q2 2024',
      'Q3 2024',
      'Q4 2024',
    ]);
  });
});

describe('buildRoadmap', () => {
  it('seeds tasks with ids', () => {
    const roadmap = buildRoadmap('2099-01-01', 'growth', 14);
    expect(roadmap.tasks).toHaveLength(2);
    roadmap.tasks.forEach(task => {
      expect(typeof task.id).toBe('string');
      expect(task.id.length).toBeGreaterThan(0);
      expect(task.title).toContain('growth');
    });
  });
});
