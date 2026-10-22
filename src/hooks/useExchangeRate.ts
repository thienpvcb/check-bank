import { useState, useEffect, useCallback } from 'react';

export interface ExchangeRateState {
  rate: number;           // 1 USD = rate VND
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  source: string;
}

// Fallback rate nếu tất cả API fail
const FALLBACK_RATE = 25_900;

// 1000 USDT → VND (vì 1 USDT ≈ 1 USD)
export const MIN_USDT = 1_000;
export const usdtToVnd = (usdt: number, rate: number) => Math.ceil(usdt * rate);
export const vndToUsdt = (vnd: number, rate: number) => Math.ceil(vnd / rate);

export const useExchangeRate = () => {
  const [state, setState] = useState<ExchangeRateState>({
    rate: FALLBACK_RATE,
    loading: true,
    error: null,
    lastUpdated: null,
    source: '',
  });

  const fetchRate = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // ── Primary: open.er-api.com (no key, 1500 req/month) ──
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.rates?.VND) {
          setState({
            rate: data.rates.VND,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            source: 'open.er-api.com',
          });
          return;
        }
      }
    } catch { /* fall through */ }

    // ── Fallback: fawazahmed0 currency-api (jsdelivr CDN, always free) ──
    try {
      const res = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const data = await res.json();
        const rate = data?.usd?.vnd;
        if (rate) {
          setState({
            rate,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            source: 'jsdelivr/fawazahmed0',
          });
          return;
        }
      }
    } catch { /* fall through */ }

    // ── All failed: dùng fallback cứng ──
    setState((s) => ({
      ...s,
      rate: FALLBACK_RATE,
      loading: false,
      error: 'Không lấy được tỷ giá thực. Đang dùng tỷ giá ước tính.',
      lastUpdated: new Date(),
      source: 'fallback',
    }));
  }, []);

  useEffect(() => {
    fetchRate();
    // Auto-refresh mỗi 5 phút
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { ...state, refetch: fetchRate };
};
