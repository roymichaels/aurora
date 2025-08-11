import { pickStrategies } from './strategies';
import { Scope } from '../types/mission';

describe('pickStrategies', () => {
  it('returns strategies matching scopes', () => {
    const result = pickStrategies(['personal', 'organization']);
    const ids = result.map(s => s.id);

    expect(ids).toContain('hypnosis');
    expect(ids).toContain('wealth');
    expect(ids).not.toContain('content');
  });
});

