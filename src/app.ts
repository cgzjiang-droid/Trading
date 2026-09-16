import Fastify, { type FastifyInstance } from 'fastify';
import { initDatabase } from './db.js';

export async function buildApp(options: { databasePath: string }): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  initDatabase(options.databasePath);
  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
