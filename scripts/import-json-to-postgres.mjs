#!/usr/bin/env node
/**
 * One-time import of a persistent local JSON store into the shared Postgres DB.
 * By default, skips existing rows (including rows already seeded on first boot).
 * --replace explicitly overwrites them. Never reads from serverless /tmp.
 *
 * DATABASE_URL=... node scripts/import-json-to-postgres.mjs [--replace]
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Pool } = require("pg");
if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL to the destination Postgres database before importing.");
  process.exit(1);
}
const replace = process.argv.includes("--replace");
const dir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const names = ["users", "settings", "projects", "blog", "media", "builds", "messages",
  "skills", "experience", "certifications", "education"];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(`CREATE TABLE IF NOT EXISTS portfolio_collections (
    name TEXT PRIMARY KEY, value JSONB NOT NULL, version BIGINT NOT NULL DEFAULT 1
  )`);
  for (const name of names) {
    let value;
    try { value = JSON.parse(await fs.readFile(path.join(dir, `${name}.json`), "utf8")); }
    catch (err) {
      if (err.code === "ENOENT") { console.log(`- ${name}: no local file, skipped`); continue; }
      throw err; // invalid JSON must not silently import an empty table
    }
    if (name === "settings" ? !value || typeof value !== "object" || Array.isArray(value) : !Array.isArray(value)) {
      throw new Error(`Invalid ${name}.json structure. Import aborted.`);
    }
    const key = `${name}.json`;
    if (name === "users" && replace) {
      const previous = await pool.query("SELECT value FROM portfolio_collections WHERE name = $1", [key]);
      const existing = Array.isArray(previous.rows[0]?.value) ? previous.rows[0].value : [];
      value = value.map((user) => ({
        ...user,
        tokenVersion: Math.max(
          user.tokenVersion ?? 1,
          existing.find((old) => old.id === user.id)?.tokenVersion ?? 0,
        ) + 1, // never let a previously issued token survive a credential import
      }));
    }
    const result = await pool.query(
      replace
        ? `INSERT INTO portfolio_collections (name, value) VALUES ($1, $2::jsonb)
           ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, version = portfolio_collections.version + 1 RETURNING name`
        : `INSERT INTO portfolio_collections (name, value) VALUES ($1, $2::jsonb)
           ON CONFLICT (name) DO NOTHING RETURNING name`,
      [key, JSON.stringify(value)],
    );
    console.log(result.rowCount ? `✓ ${name}: imported${replace ? " (replaced existing row)" : ""}` :
      `- ${name}: already exists; use --replace if you intentionally want to overwrite it`);
  }
} finally { await pool.end(); }
console.log("Import complete. Back up your data directory before deleting it.");
