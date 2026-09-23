#!/usr/bin/env node
/** Admin recovery for either the persistent JSON volume or DATABASE_URL. */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let bcrypt;
try { bcrypt = require("bcryptjs"); }
catch {
  console.error("bcryptjs not found — run `npm ci` first (or run inside the app container).");
  process.exit(1);
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SEED_FILE = path.join(DATA_DIR, "seed", "users.seed.json");
const SEED_FALLBACK = path.join(process.cwd(), "seed-defaults", "users.seed.json");
const SEED_MODE = process.argv.includes("--seed");

async function readJsonSafe(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return null; }
}

const email = (arg("email", "") || "").trim().toLowerCase();
const password = arg("password", "Admin@12345");
if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
  console.error("Password must have at least 8 characters, a letter and a number.");
  process.exit(1);
}
if (SEED_MODE && process.env.DATABASE_URL) {
  console.error("--seed edits a local file, not the live database. Remove --seed to reset the DATABASE_URL admin.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const defaultUsers = (await readJsonSafe(SEED_FILE)) ?? (await readJsonSafe(SEED_FALLBACK)) ?? [];

function reset(users) {
  // Work on a copy so retrying an optimistic database update never mutates
  // the original row or increments the token version twice.
  const list = structuredClone(Array.isArray(users) ? users : defaultUsers);
  let target =
    (email && list.find((u) => (u.email ?? "").toLowerCase() === email)) ||
    list.find((u) => u.role === "admin") || list[0] || null;
  if (!target) {
    const base = defaultUsers[0] ?? {
      id: "usr_admin_abhishek", name: "Abhishek Prajapati", role: "admin",
      createdAt: new Date().toISOString(),
    };
    target = { ...base, email: email || base.email || "admin@example.com" };
    list.push(target);
  } else if (email) target.email = email;
  target.passwordHash = hash;
  target.role = "admin";
  target.tokenVersion = (target.tokenVersion ?? 1) + 1;
  return { users: list, adminEmail: target.email };
}

let adminEmail;
if (process.env.DATABASE_URL && !SEED_MODE) {
  let Pool;
  try { ({ Pool } = require("pg")); }
  catch { console.error("pg not found — run `npm ci` first."); process.exit(1); }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS portfolio_collections (
      name TEXT PRIMARY KEY, value JSONB NOT NULL, version BIGINT NOT NULL DEFAULT 1
    )`);
    let saved = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = await pool.query("SELECT value, version FROM portfolio_collections WHERE name = $1", ["users.json"]);
      if (!result.rows.length) {
        await pool.query(
          "INSERT INTO portfolio_collections (name, value) VALUES ($1, $2::jsonb) ON CONFLICT (name) DO NOTHING",
          ["users.json", JSON.stringify(defaultUsers)],
        );
        continue;
      }
      const { users, adminEmail: nextEmail } = reset(result.rows[0].value);
      const updated = await pool.query(
        "UPDATE portfolio_collections SET value = $1::jsonb, version = version + 1 WHERE name = $2 AND version = $3 RETURNING version",
        [JSON.stringify(users), "users.json", result.rows[0].version],
      );
      if (updated.rowCount === 1) { adminEmail = nextEmail; saved = true; break; }
    }
    if (!saved) throw new Error("Concurrent admin updates prevented reset. Retry.");
    console.log("✓ Admin credentials reset in Postgres (DATABASE_URL).");
  } finally { await pool.end(); }
} else {
  const file = SEED_MODE ? SEED_FILE : USERS_FILE;
  const current = await readJsonSafe(file);
  const { users, adminEmail: nextEmail } = reset(current);
  adminEmail = nextEmail;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(users, null, 2) + "\n", "utf8");
  console.log(`✓ Admin credentials reset in ${path.relative(process.cwd(), file)}.`);
  if (SEED_MODE) console.warn("  Committing a password hash in Git is not recommended for production. Use DATABASE_URL instead.");
}
console.log(`  email: ${adminEmail}`);
console.log("  All existing sessions have been invalidated. Sign in again at /admin/login.");
