import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAiChat } from '../useAiChat';

const invokeMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: getSessionMock },
    functions: { invoke: invokeMock },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAiChat', () => {
  it('returns reply on success', async () => {
    invokeMock.mockResolvedValueOnce({ data: { reply: 'hi' }, error: null });
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAiChat());
    const res = await result.current.sendMessage([{ role: 'user', content: 'hello' }]);

    expect(invokeMock).toHaveBeenCalledWith('ai-helper', {
      body: { history: [{ role: 'user', content: 'hello' }], image: undefined },
      headers: undefined,
    });
    expect(res).toEqual({ reply: 'hi', analysis: null });
    expect(result.current.error).toBeNull();
  });

  it('handles errors from ai-helper', async () => {
    invokeMock.mockResolvedValueOnce({ data: { error: 'bad' }, error: null });
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAiChat());
    const res = await result.current.sendMessage([{ role: 'user', content: 'hi' }]);

    expect(res.reply).toBeNull();
    expect(result.current.error).toMatch(/Beklager/);
  });

  it('adds analysis when image is provided', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: { result: { name: 'Hammer', description: 'desc' } }, error: null })
      .mockResolvedValueOnce({ data: { reply: 'ok' }, error: null });
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAiChat());
    const res = await result.current.sendMessage([{ role: 'user', content: 'hi' }], 'img');

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'inventory-ai', { body: { image: 'img' } });
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'ai-helper', expect.any(Object));
    expect(res).toEqual({ reply: 'ok', analysis: 'Hammer. desc' });
  });
});
