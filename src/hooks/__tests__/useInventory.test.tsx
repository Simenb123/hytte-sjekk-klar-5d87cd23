import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory, mapItemToRecord } from '../useInventory';

vi.mock('@/hooks/useAuth', () => ({
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
    await waitFor(() =>
      expect(result.current.data?.[0].name).toBe('Hammer')
    );
  });
});

describe('mapItemToRecord', () => {
  it('maps item fields correctly', () => {
    const record = mapItemToRecord({ name: 'Hammer', color: 'red' }, '1');
    expect(record).toEqual({
      name: 'Hammer',
      description: null,
      brand: null,
      color: 'red',
      location: null,
      shelf: null,
      size: null,
      owner: null,
      notes: null,
      category: 'Annet',
      family_member_id: null,
      user_id: '1'
    });
  });
});
