import { buildApp } from './app.js';
import { config } from './config.js';

const app = await buildApp({ databasePath: config.databasePath });
await app.listen({ port: config.port, host: '127.0.0.1' });
