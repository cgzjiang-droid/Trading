import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('investment decision logs', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ databasePath: ':memory:' }); });
  afterAll(async () => { await app.close(); });

  it('stores a decision reason and returns its current outcome', async () => {
    const create = await app.inject({ method: 'POST', url: '/decision-logs', payload: { symbol: 'NVDA', side: 'buy', quantity: 2, price: 100, reason: 'AI 需求持续增长' } });
    expect(create.statusCode).toBe(201);
    const list = await app.inject({ method: 'GET', url: '/decision-logs' });
    expect(list.statusCode).toBe(200);
    expect(list.json()[0]).toEqual(expect.objectContaining({ symbol: 'NVDA', side: 'buy', reason: 'AI 需求持续增长', currentPrice: 118.46, priceChange: 18.46, outcome: 'positive' }));
  });

  it('rejects a decision log with an unknown stock', async () => {
    const response = await app.inject({ method: 'POST', url: '/decision-logs', payload: { symbol: 'UNKNOWN', side: 'buy', quantity: 1, price: 10, reason: 'test' } });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found' } });
  });
});
