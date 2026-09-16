import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ databasePath: ':memory:' }); });
  afterAll(async () => { await app.close(); });

  it('returns a healthy service response', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
