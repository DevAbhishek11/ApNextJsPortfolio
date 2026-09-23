import { Pool } from "pg";

// One JSON document per collection, with an optimistic version. Postgres is
// shared by all serverless instances and survives redeploys; compare-and-swap
// ensures concurrent read/modify/write operations cannot drop each other.
// Schema is created lazily at runtime (not while Next.js builds pages).
export type Query = <T extends Record<string, unknown>>(
  sql: string,
  params?: unknown[],
) => Promise<{ rows: T[]; rowCount: number | null }>;

type Stored<T> = { value: T; version: number | string };

export function createPostgresStore(query: Query) {
  let ready: Promise<void> | undefined;
  async function ensureTable() {
    ready ??= (async () => {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS portfolio_collections (
            name TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            version BIGINT NOT NULL DEFAULT 1
          )
        `);
      } catch (err) {
        // A simultaneous first request on another function may have created
        // the table concurrently (Postgres can report 23505 even with IF NOT
        // EXISTS). Only swallow that race if the table actually exists now.
        const code = (err as { code?: string }).code;
        if (code !== "23505" && code !== "42P07") throw err;
        const table = await query<{ exists: string | null }>(
          "SELECT to_regclass('portfolio_collections') AS exists",
        );
        if (!table.rows[0]?.exists) throw err;
      }
    })().catch((err: unknown) => {
      ready = undefined; // a transient connection error must be retryable
      throw err;
    });
    await ready;
  }

  async function get<T>(name: string, seed: T): Promise<{ value: T; version: number }> {
    await ensureTable();
    let result = await query<Stored<T>>("SELECT value, version FROM portfolio_collections WHERE name = $1", [name]);
    if (!result.rows.length) {
      // Insert the committed seed ONCE. In particular, never overwrite an
      // existing users row (and resurrect the default admin password).
      await query(
        "INSERT INTO portfolio_collections (name, value) VALUES ($1, $2::jsonb) ON CONFLICT (name) DO NOTHING",
        [name, JSON.stringify(seed)],
      );
      result = await query<Stored<T>>("SELECT value, version FROM portfolio_collections WHERE name = $1", [name]);
    }
    if (!result.rows.length) throw new Error(`Failed to initialize collection ${name}`);
    const row = result.rows[0];
    return {
      value: (typeof row.value === "string" ? JSON.parse(row.value) : row.value) as T,
      version: Number(row.version),
    };
  }

  return {
    async read<T>(name: string, seed: T): Promise<T> {
      return (await get(name, seed)).value;
    },
    async update<T>(name: string, seed: T, mutate: (current: T) => T | Promise<T>): Promise<T> {
      for (let attempt = 0; attempt < 20; attempt++) {
        const current = await get(name, seed);
        const next = await mutate(structuredClone(current.value));
        const saved = await query(
          "UPDATE portfolio_collections SET value = $1::jsonb, version = version + 1 WHERE name = $2 AND version = $3 RETURNING version",
          [JSON.stringify(next), name, current.version],
        );
        if (saved.rowCount === 1) return next;
        // Another instance wrote this collection; re-read and replay mutation.
      }
      throw new Error(`Concurrent updates to ${name} could not be saved. Please retry.`);
    },
  };
}

let pool: Pool | undefined;
let store: ReturnType<typeof createPostgresStore> | undefined;

export function postgresStore() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    pool.on("error", (err) => console.error("[db] idle Postgres connection error:", err));
  }
  store ??= createPostgresStore(<T extends Record<string, unknown>>(sql: string, params?: unknown[]) =>
    pool!.query<T>(sql, params),
  );
  return store;
}
