import { getNoiseGroups, getOverview, getStock } from './market-data.js';
import type { Quote } from './market-data.js';

export interface MarketDataProvider {
  getOverview(): Promise<ReturnType<typeof getOverview> & { source: string }>;
  getStock(symbol: string): Promise<ReturnType<typeof getStock>>;
  getNoiseGroups(): Promise<ReturnType<typeof getNoiseGroups> & { source: string }>;
}

export class DemoMarketDataProvider implements MarketDataProvider {
  async getOverview() { return { ...getOverview(), source: 'demo' }; }
  async getStock(symbol: string) { return getStock(symbol); }
  async getNoiseGroups() { return { ...getNoiseGroups(), source: 'demo' }; }
}

/** Free latest-price adapter. Public Yahoo requests may throttle, so callers retain demo fallback. */
export class YahooLatestProvider implements MarketDataProvider {
  private readonly fallback = new DemoMarketDataProvider();
  private readonly tickers = ['^GSPC', '^IXIC', '^DJI', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];
  private async quote(symbol: string): Promise<Quote | undefined> {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`);
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number; regularMarketTime?: number } }> } };
    const meta = payload.chart?.result?.[0]?.meta; if (!meta?.regularMarketPrice) return undefined;
    const names: Record<string, string> = { '^GSPC': '标普 500', '^IXIC': '纳斯达克', '^DJI': '道琼斯', AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'NVIDIA', TSLA: 'Tesla', AMZN: 'Amazon' };
    const price = meta.regularMarketPrice; const previous = meta.previousClose ?? price; const change = price - previous;
    return { symbol: symbol.replace('^GSPC', 'SPX').replace('^IXIC', 'IXIC').replace('^DJI', 'DJI'), name: names[symbol] ?? symbol, price, change, changePercent: previous ? (change / previous) * 100 : 0, updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString() };
  }
  async getOverview() { const quotes = (await Promise.all(this.tickers.map((ticker) => this.quote(ticker).catch(() => undefined)))).filter(Boolean) as Quote[]; if (quotes.length < 3) return { ...(await this.fallback.getOverview()), source: 'demo-fallback' }; return { updatedAt: quotes[0].updatedAt, indices: quotes.slice(0, 3), watchlist: quotes.slice(3), source: 'yahoo-latest' }; }
  async getStock(symbol: string) { return this.fallback.getStock(symbol); }
  async getNoiseGroups() { return { ...(await this.fallback.getNoiseGroups()), source: 'demo' as const }; }
}
