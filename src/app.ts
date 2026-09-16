import Fastify, { type FastifyInstance } from 'fastify';
import { initDatabase } from './db.js';
import { getNoiseGroups, getOverview, getStock } from './market-data.js';
import { addWatchlist, createOrder, getPortfolio, initTradingSchema, listOrders, listWatchlist, removeWatchlist } from './paper-trading.js';

export async function buildApp(options: { databasePath: string }): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  initDatabase(options.databasePath);
  initTradingSchema();
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/market/overview', async () => getOverview());
  app.get('/market/noise', async () => getNoiseGroups());
  app.get<{ Params: { symbol: string } }>('/stocks/:symbol', async (request, reply) => {
    const stock = getStock(request.params.symbol);
    if (!stock) return reply.code(404).send({ error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found' } });
    return stock;
  });
  app.get('/watchlist', async () => listWatchlist());
  app.post<{ Body: { symbol?: string } }>('/watchlist', async (request, reply) => {
    if (!request.body?.symbol) return reply.code(400).send({ error: { code: 'INVALID_SYMBOL', message: 'Symbol is required' } });
    const result = addWatchlist(request.body.symbol);
    if (!result) return reply.code(404).send({ error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found' } });
    return reply.code(201).send(result);
  });
  app.delete<{ Params: { symbol: string } }>('/watchlist/:symbol', async (request) => ({ removed: removeWatchlist(request.params.symbol) }));
  app.get('/portfolio', async () => getPortfolio());
  app.get('/orders', async () => listOrders());
  app.post<{ Body: { symbol?: string; side?: 'buy' | 'sell'; quantity?: number; reason?: string } }>('/orders', async (request, reply) => {
    const body = request.body ?? {};
    if (!body.symbol || !body.side || body.quantity === undefined) return reply.code(400).send({ error: { code: 'INVALID_ORDER', message: 'Symbol, side, and quantity are required' } });
    const result = createOrder({ symbol: body.symbol, side: body.side, quantity: body.quantity, reason: body.reason });
    if ('error' in result) return reply.code(result.error.code === 'STOCK_NOT_FOUND' ? 404 : 400).send(result);
    return reply.code(201).send(result);
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode;
    return reply.code(statusCode && statusCode >= 400 ? statusCode : 500)
      .send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
  return app;
}
