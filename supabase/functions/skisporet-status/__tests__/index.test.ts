import { describe, it, expect, beforeEach, vi } from 'vitest'

let handler: ((req: Request) => Promise<Response>) | undefined

beforeEach(async () => {
  vi.resetModules()
  handler = undefined

  interface TestDeno {
    env: { get: (key: string) => string | undefined }
  }
  ;(globalThis as unknown as { Deno: TestDeno }).Deno = {
    env: {
      get: vi.fn((key: string) =>
        key === 'SKISPORET_AREA_ID' ? '42' : undefined
      ),
    },
  }

  vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
    serve: (h: typeof handler) => {
      handler = h
    },
  }), { virtual: true })

  await import('../index.ts')
})

describe('skisporet-status function', () => {
  it('returns track status with cache header', async () => {
    const mockData = { updated: '2024-01-01T00:00:00Z', tracks: [{ id: 1 }] }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))

    const res = await handler!(new Request('http://localhost'))
    expect(res.headers.get('Cache-Control')).toBe('s-maxage=300')
    const json = await res.json()
    expect(json).toEqual({ status: 'ok', ...mockData })
  })
})
