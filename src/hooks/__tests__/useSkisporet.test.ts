import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSkisporet } from '../useSkisporet';
import type { TrackStatus } from '@/types/skisporet';

const mockData: TrackStatus = {
  status: 'ok',
  updated: '2024-01-01T12:00:00Z',
  tracks: [{ id: 1, name: 'Testløype', groomed: '2024-01-01T10:00:00Z' }],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useSkisporet', () => {
  it('returns track status data', async () => {
    const { result } = renderHook(() => useSkisporet(), { wrapper });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual(mockData);
  });
});
