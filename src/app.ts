import Fastify, { type FastifyInstance } from 'fastify';
import { initDatabase } from './db.js';
import { getNoiseGroups, getOverview, getStock } from './market-data.js';

export async function buildApp(options: { databasePath: string }): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  initDatabase(options.databasePath);
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/market/overview', async () => getOverview());
  app.get('/market/noise', async () => getNoiseGroups());
  app.get<{ Params: { symbol: string } }>('/stocks/:symbol', async (request, reply) => {
    const stock = getStock(request.params.symbol);
    if (!stock) return reply.code(404).send({ error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found' } });
    return stock;
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
