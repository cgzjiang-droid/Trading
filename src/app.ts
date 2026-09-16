import Fastify, { type FastifyInstance } from 'fastify';
import { initDatabase } from './db.js';

export async function buildApp(options: { databasePath: string }): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  initDatabase(options.databasePath);
  app.get('/health', async () => ({ status: 'ok' }));
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode;
    return reply.code(statusCode && statusCode >= 400 ? statusCode : 500)
      .send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
  return app;
}
