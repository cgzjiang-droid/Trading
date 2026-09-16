import { getNoiseGroups, getOverview, getStock } from './market-data.js';

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
