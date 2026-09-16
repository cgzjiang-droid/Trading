import { DatabaseSync } from 'node:sqlite';

let database: DatabaseSync | undefined;

export function initDatabase(databasePath: string): DatabaseSync {
  database?.close();
  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return database;
}

export function getDatabase(): DatabaseSync {
  if (!database) throw new Error('Database has not been initialized');
  return database;
}
