import { neon } from '@neondatabase/serverless';
import type { PopularDatabase } from './popular-handlers.js';

export function createNeonPopularDatabase(connectionString = process.env.DATABASE_URL): PopularDatabase | null {
  if (!connectionString) return null;
  const sql = neon(connectionString);
  return {
    async query<T extends Record<string, unknown>>(statement: string, parameters: unknown[]): Promise<T[]> {
      return (await sql.query(statement, parameters)) as T[];
    },
  };
}
