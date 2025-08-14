import { describe, it, expect, beforeEach } from 'vitest';
import { getRequiredEnv, getRedirectURI } from '../utils';

type DenoEnv = {
  env: {
    get: (key: string) => string | undefined;
  };
};

type GlobalWithDeno = typeof globalThis & { Deno: DenoEnv };

beforeEach(() => {
  // reset Deno env mock
  (globalThis as GlobalWithDeno).Deno = { env: { get: () => undefined } };
});

describe('getRedirectURI', () => {
  it('uses preview url for lovableproject.com', () => {
    const url = getRedirectURI('https://foo.lovableproject.com');
    expect(url).toBe('https://foo.lovableproject.com/auth/calendar');
  });

  it('uses preview url for lovable.app', () => {
    const url = getRedirectURI('https://id-preview--97756950-3c85-41a4-94ae-a14ccf690d68.lovable.app');
    expect(url).toBe('https://id-preview--97756950-3c85-41a4-94ae-a14ccf690d68.lovable.app/auth/calendar');
  });

  it('defaults to origin for other domains', () => {
    const url = getRedirectURI('https://example.com');
    expect(url).toBe('https://example.com/auth/calendar');
  });
});

describe('getRequiredEnv', () => {
  it('returns value when present', () => {
    (globalThis as GlobalWithDeno).Deno.env.get = () => 'val';
    expect(getRequiredEnv('X')).toBe('val');
  });

  it('throws when missing', () => {
    (globalThis as GlobalWithDeno).Deno.env.get = () => undefined;
    expect(() => getRequiredEnv('Y')).toThrow();
  });
});
