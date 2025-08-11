import { validateAnswer } from './validation';

describe('validateAnswer', () => {
  it('accepts answers with three or more meaningful words', () => {
    expect(validateAnswer('The quick brown fox jumps')).toBe(true);
  });

  it('rejects answers with too few meaningful words', () => {
    expect(validateAnswer('the and but')).toBe(false);
  });

  it('ignores stop words when counting', () => {
    expect(validateAnswer('the cat quietly sleeps')).toBe(true);
  });

  it('rejects empty input', () => {
    expect(validateAnswer('')).toBe(false);
  });
});
