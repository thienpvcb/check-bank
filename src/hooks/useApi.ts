/**
 * useApi — tự động chọn real API hoặc mock data
 * dựa vào VITE_USE_API env var
 */
import { useState, useEffect, useCallback } from 'react';

const USE_API = import.meta.env.VITE_USE_API === 'true';
export { USE_API };

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiData<T>(
  apiFn: () => Promise<T>,
  mockData: T,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(USE_API);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!USE_API) {
      setData(mockData);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
      setData(mockData); // fallback to mock on error
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
