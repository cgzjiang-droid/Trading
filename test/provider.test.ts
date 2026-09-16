import { describe, expect, it } from 'vitest';
import { DemoMarketDataProvider } from '../src/market-provider.js';

describe('market data provider', () => {
  it('exposes a replaceable provider contract with demo data', async () => {
    const provider = new DemoMarketDataProvider();
    expect((await provider.getOverview()).source).toBe('demo');
    expect((await provider.getStock('AAPL'))?.quote.symbol).toBe('AAPL');
  });
});
