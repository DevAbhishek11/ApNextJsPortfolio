import { test } from "node:test";
import assert from "node:assert/strict";

test("serverless without DATABASE_URL serves public seeds but refuses all writes/login", async () => {
  const before = process.env.VERCEL;
  const url = process.env.DATABASE_URL;
  process.env.VERCEL = "1";
  delete process.env.DATABASE_URL;
  try {
    const { IS_SERVERLESS, readJson, writeJson, updateJson, assertWritableStore,
      StorageConfigurationError } = await import("../lib/db/store");
    assert.equal(IS_SERVERLESS, true);
    const users = await readJson<{ passwordHash: string }[]>("users.json", []);
    assert.ok(users[0]?.passwordHash.startsWith("$2b$"));
    assert.throws(() => assertWritableStore(), StorageConfigurationError);
    await assert.rejects(writeJson("users.json", []), StorageConfigurationError);
    await assert.rejects(updateJson("settings.json", {}, () => ({})), StorageConfigurationError);
    // Attempting a write did not change the public seed.
    assert.equal((await readJson<{ passwordHash: string }[]>("users.json", []))[0].passwordHash,
      users[0].passwordHash);
  } finally {
    if (before === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = before;
    if (url === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = url;
  }
});
