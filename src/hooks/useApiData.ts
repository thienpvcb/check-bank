/**
 * useApiData — fetch từ real API nếu VITE_USE_API=true,
 * fallback về mock data nếu false hoặc lỗi network
 */
import { useState, useEffect, useCallback } from 'react';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export const useApiData = <T>(
  fetcher: () => Promise<T>,
  mockData: T,
  deps: unknown[] = [],
) => {
  const [data, setData]       = useState<T>(mockData);
  const [loading, setLoading] = useState(USE_API);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!USE_API) { setData(mockData); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[API] fallback to mock:', err);
      setData(mockData);   // graceful fallback
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
};
