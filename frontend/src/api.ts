const baseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error((await response.json()).error?.message ?? '请求失败');
  return response.json();
}

export const api = {
  overview: () => request<any>('/market/overview'),
  noise: () => request<any>('/market/noise'),
  portfolio: () => request<any>('/portfolio'),
  orders: () => request<any[]>('/orders'),
  createOrder: (body: object) => request<any>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  addWatchlist: (symbol: string) => request<any>('/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) }),
};
