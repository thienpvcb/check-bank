// Central API service — swap mock ↔ real backend here
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

const getToken = () => sessionStorage.getItem('cb_token');

const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data.data as T;
}

const get  = <T>(path: string)              => request<T>('GET',    path);
const post = <T>(path: string, body: unknown) => request<T>('POST',   path, body);
const del  = <T>(path: string)              => request<T>('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    post<{ token: string; user: import('../store/authStore').User }>('/auth/login', { username, password }),

  me: () => get<import('../store/authStore').User>('/auth/me'),

  logout: () => post('/auth/logout', {}),
};

// ── Reference data ────────────────────────────────────────────
export const referenceApi = {
  banks:        () => get<import('../types').Bank[]>('/banks/active'),
  crypto:       () => get<import('../types').CryptoAsset[]>('/crypto'),
  gateways:     () => get<import('../types').PaymentGateway[]>('/gateways'),
  gatewayStats: () => get<{ total: number; online: number; offline: number; maintenance: number }>('/gateways/stats'),
  exchangeRate: () => get<{ rate: number; updatedAt: number; source: string }>('/exchange-rate'),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionApi = {
  list: (params?: { type?: string; status?: string; method?: string; limit?: number; offset?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return get<import('../types').Transaction[]>(`/transactions${qs}`);
  },

  poll: (id: string) =>
    get<{ id: string; status: string; expiresAt: string; remainingMs: number; remainingSec: number; isExpired: boolean }>(`/transactions/${id}/poll`),

  depositCrypto: (body: { symbol: string; network: string }) =>
    post<import('../types').Transaction & { expiresAt: string; timeoutMinutes: number }>('/transactions/deposit/crypto', body),

  depositBank: (body: { bankCode: string; amount: number }) =>
    post<import('../types').Transaction & { transferContent: string; expiresAt: string; timeoutMinutes: number }>('/transactions/deposit/bank', body),

  withdrawCrypto: (body: { symbol: string; network: string; address: string; amount: number }) =>
    post<import('../types').Transaction & { timeoutMinutes: number }>('/transactions/withdraw/crypto', body),

  withdrawBank: (body: { bankCode: string; accountNumber: string; accountName: string; amount: number }) =>
    post<import('../types').Transaction & { timeoutMinutes: number }>('/transactions/withdraw/bank', body),
};

// ── Game portal ───────────────────────────────────────────────
export const gamePortalApi = {
  platforms:   () => get<import('../types').GamePlatform[]>('/game-portal/platforms'),
  myLinks:     () => get<import('../types').LinkedPlatform[]>('/game-portal/links'),

  link: (body: { platformId: string; domain: string; apiKey: string }) =>
    post<import('../types').LinkedPlatform>('/game-portal/links', body),

  unlink: (platformId: string) =>
    del(`/game-portal/links/${platformId}`),

  initTransaction: (body: {
    platformId: string; type: 'deposit' | 'withdraw';
    currency: 'VND' | 'USDT'; userId: string;
    username: string; amount: number;
  }) => post<{ txId: string; otp: string; otpExpiresIn: number }>('/game-portal/transactions/init', body),

  confirmTransaction: (body: {
    txId: string; platformId: string; type: 'deposit' | 'withdraw';
    currency: 'VND' | 'USDT'; userId: string;
    username: string; amount: number; otp: string;
  }) => post<import('../types').PlatformTransaction>('/game-portal/transactions/confirm', body),

  txHistory: () => get<import('../types').PlatformTransaction[]>('/game-portal/transactions'),
};

// ── Token helpers ─────────────────────────────────────────────
export const setToken = (token: string) => sessionStorage.setItem('cb_token', token);
export const clearToken = () => sessionStorage.removeItem('cb_token');
