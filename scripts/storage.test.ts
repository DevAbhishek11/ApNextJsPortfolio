import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createPostgresStore, type Query } from "../lib/db/postgres";

function setup() {
  // PGlite runs real PostgreSQL (WASM), including JSONB and row versions.
  const db = new PGlite();
  const query: Query = async <T extends Record<string, unknown>>(sql: string, values?: unknown[]) => {
    const response = await db.query<T>(sql, values);
    return { rows: response.rows, rowCount: response.rowCount ?? null };
  };
  return { db, query };
}

test("Postgres seeds once, persists across instances and never resets changed passwords", async () => {
  const { query } = setup();
  const a = createPostgresStore(query);
  const b = createPostgresStore(query); // another serverless invocation/instance
  const seed = [{ id: "admin", hash: "original", tokenVersion: 1 }];
  assert.deepEqual(await a.read("users.json", seed), seed);
  await a.update("users.json", seed, (users) => users.map((user) => ({
    ...user, hash: "new-password-hash", tokenVersion: user.tokenVersion + 1,
  })));
  assert.deepEqual(await b.read("users.json", seed), [
    { id: "admin", hash: "new-password-hash", tokenVersion: 2 },
  ]);
  // Simulate redeploy: the committed default seed hasn't changed, DB hasn't reset.
  const afterRestart = createPostgresStore(query);
  assert.equal((await afterRestart.read("users.json", seed))[0].hash, "new-password-hash");
  assert.equal((await afterRestart.read("users.json", seed))[0].tokenVersion, 2);
});

test("Concurrent updates on separate instances do not lose project/message edits", async () => {
  const { query } = setup();
  const a = createPostgresStore(query);
  const b = createPostgresStore(query);
  const seed: string[] = ["seed"];
  await Promise.all(Array.from({ length: 10 }, (_, i) =>
    (i % 2 ? a : b).update("projects.json", seed, (items) => [...items, `edit-${i}`]),
  ));
  const saved = await createPostgresStore(query).read("projects.json", seed);
  assert.equal(saved.length, 11);
  for (let i = 0; i < 10; i++) assert.ok(saved.includes(`edit-${i}`));
});

test("Seed data cannot be mutated by callers and new collections are independent", async () => {
  const { query } = setup();
  const a = createPostgresStore(query);
  const seed = [{ value: "seed" }];
  const first = await a.read("settings.json", seed);
  first[0].value = "changed locally";
  assert.equal((await a.read("settings.json", seed))[0].value, "seed");
  assert.deepEqual(await a.read("media.json", []), []);
});
