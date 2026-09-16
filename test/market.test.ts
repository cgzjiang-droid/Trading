import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('market APIs', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ databasePath: ':memory:' }); });
  afterAll(async () => { await app.close(); });

  it('returns index and watchlist quotes from the market overview', async () => {
    const response = await app.inject({ method: 'GET', url: '/market/overview' });
    expect(response.statusCode).toBe(200);
    expect(response.json().indices).toEqual(expect.arrayContaining([
      expect.objectContaining({ symbol: 'SPX', name: '标普 500' }),
      expect.objectContaining({ symbol: 'IXIC', name: '纳斯达克' }),
    ]));
    expect(response.json().watchlist).toEqual(expect.arrayContaining([
      expect.objectContaining({ symbol: 'AAPL' }),
    ]));
  });

  it('returns a stock quote, history, and related information', async () => {
    const response = await app.inject({ method: 'GET', url: '/stocks/NVDA' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.objectContaining({
      quote: expect.objectContaining({ symbol: 'NVDA' }),
      history: expect.any(Array),
      items: expect.any(Array),
    }));
  });

  it('groups market information for the noise radar', async () => {
    const response = await app.inject({ method: 'GET', url: '/market/noise' });
    expect(response.statusCode).toBe(200);
    expect(response.json().groups).toEqual(expect.objectContaining({
      important: expect.any(Array),
      general: expect.any(Array),
      noise: expect.any(Array),
      risk: expect.any(Array),
    }));
  });
});
