import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// These will be assigned inside the mock factory to avoid hoisting issues
let insertMock: ReturnType<typeof vi.fn>;
let fromMock: ReturnType<typeof vi.fn>;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'uid' } }),
}));

vi.mock('@/integrations/supabase/client', () => {
  insertMock = vi.fn().mockResolvedValue({ error: null });
  fromMock = vi.fn(() => ({ insert: insertMock }));
  return {
    supabase: {
      from: fromMock,
    },
  };
});

// Import the hook after mocks are set up
import { useAddHyttebokEntry } from '../useHyttebok';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useAddHyttebokEntry', () => {
  it('inserts entry with content and user_id', async () => {
    const { result } = renderHook(() => useAddHyttebokEntry(), { wrapper });
    await result.current.mutateAsync({ content: 'test' });
    expect(insertMock).toHaveBeenCalledWith({ text: 'test', user_id: 'uid' });
  });
});
