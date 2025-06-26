import { describe, it, expect } from 'vitest';
import { processBase64Chunks } from '../index';

const base64 = Buffer.from('hello').toString('base64');

describe('processBase64Chunks', () => {
  it('converts base64 string to Uint8Array', () => {
    const result = processBase64Chunks(base64, 2);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(result)).toBe('hello');
  });
});
