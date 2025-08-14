import { describe, it, expect } from 'vitest';
import { __runMammasHjorneSelfTests } from '../MammasHjorneScreen';

describe('MammasHjorneScreen self tests', () => {
  it('should return all true', () => {
    const results = __runMammasHjorneSelfTests();
    Object.entries(results).forEach(([key, value]) => {
      expect(value).toBe(true);
    });
  });
});
