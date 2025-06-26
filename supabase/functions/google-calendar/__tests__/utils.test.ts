import { describe, it, expect, beforeEach } from 'vitest';
import { getRequiredEnv, getRedirectURI } from '../utils';

beforeEach(() => {
  // reset Deno env mock
  (globalThis as any).Deno = { env: { get: () => undefined } };
});

describe('getRedirectURI', () => {
  it('uses preview url for lovableproject.com', () => {
    const url = getRedirectURI('https://foo.lovableproject.com');
    expect(url).toBe('https://foo.lovableproject.com/auth/calendar');
  });

  it('defaults to origin for other domains', () => {
    const url = getRedirectURI('https://example.com');
    expect(url).toBe('https://example.com/auth/calendar');
  });
});

describe('getRequiredEnv', () => {
  it('returns value when present', () => {
    (globalThis as any).Deno.env.get = () => 'val';
    expect(getRequiredEnv('X')).toBe('val');
  });

  it('throws when missing', () => {
    (globalThis as any).Deno.env.get = () => undefined;
    expect(() => getRequiredEnv('Y')).toThrow();
  });
});
