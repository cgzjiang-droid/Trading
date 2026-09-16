import { afterEach, describe, expect, it } from 'vitest';
import { getDatabase, initDatabase } from '../src/db.js';

afterEach(() => getDatabase()?.close());

describe('database initialization', () => {
  it('creates the schema metadata table', () => {
    initDatabase(':memory:');
    const row = getDatabase().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'").get();
    expect(row).toEqual({ name: 'schema_meta' });
    expect(getDatabase().prepare("SELECT value FROM schema_meta WHERE key='version'").get()).toEqual({ value: '1' });
  });
});
