import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('watchlist and paper trading APIs', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ databasePath: ':memory:' }); });
  afterAll(async () => { await app.close(); });

  it('adds and lists a watchlist symbol', async () => {
    const add = await app.inject({ method: 'POST', url: '/watchlist', payload: { symbol: 'NVDA' } });
    expect(add.statusCode).toBe(201);
    const list = await app.inject({ method: 'GET', url: '/watchlist' });
    expect(list.json()).toEqual([{ symbol: 'NVDA' }]);
  });

  it('buys shares and reflects the position in the portfolio', async () => {
    const response = await app.inject({ method: 'POST', url: '/orders', payload: { symbol: 'AAPL', side: 'buy', quantity: 10, reason: '测试基本面' } });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(expect.objectContaining({ symbol: 'AAPL', side: 'buy', quantity: 10, price: 229.12 }));
    const portfolio = await app.inject({ method: 'GET', url: '/portfolio' });
    expect(portfolio.json()).toEqual(expect.objectContaining({ cash: 97708.8, totalAssets: 100000, positions: [expect.objectContaining({ symbol: 'AAPL', quantity: 10, marketValue: 2291.2, unrealizedPnl: 0 })] }));
  });

  it('rejects an order that exceeds the current position', async () => {
    const response = await app.inject({ method: 'POST', url: '/orders', payload: { symbol: 'MSFT', side: 'sell', quantity: 1 } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: 'INSUFFICIENT_POSITION', message: 'Insufficient position' } });
  });

  it('rejects a non-positive or fractional quantity', async () => {
    const response = await app.inject({ method: 'POST', url: '/orders', payload: { symbol: 'AAPL', side: 'buy', quantity: 0.5 } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: 'INVALID_QUANTITY', message: 'Quantity must be a positive integer' } });
  });

  it('sells shares and calculates realized profit', async () => {
    await app.inject({ method: 'POST', url: '/orders', payload: { symbol: 'NVDA', side: 'buy', quantity: 1 } });
    const sell = await app.inject({ method: 'POST', url: '/orders', payload: { symbol: 'NVDA', side: 'sell', quantity: 1 } });
    expect(sell.statusCode).toBe(201);
    const portfolio = await app.inject({ method: 'GET', url: '/portfolio' });
    expect(portfolio.json().realizedPnl).toBe(0);
  });
});
