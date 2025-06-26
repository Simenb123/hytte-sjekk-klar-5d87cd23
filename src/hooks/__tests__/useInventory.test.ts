import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory } from '../useInventory';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' }, session: {} }),
}));

const mockItem = { id: '1', name: 'Hammer' };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [mockItem], error: null }),
        }),
      }),
    }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useInventory', () => {
  it('fetches inventory items', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data?.[0].name).toBe('Hammer');
  });
});
