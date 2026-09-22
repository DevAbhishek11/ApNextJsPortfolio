#!/usr/bin/env node
/**
 * Admin password recovery — works fully offline against the data dir.
 *
 * Usage:
 *   node scripts/reset-admin.mjs                         # reset to Admin@12345
 *   node scripts/reset-admin.mjs --password=NewPass123   # reset to a chosen password
 *   node scripts/reset-admin.mjs --email=me@x.com --password=NewPass123
 *   docker compose exec portfolio node scripts/reset-admin.mjs
 *
 * What it does: verifies/normalizes the admin record in data/users.json
 * (fresh bcrypt hash at cost 12, tokenVersion bumped → all sessions are
 * invalidated). Then sign in again at /admin/login.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
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

async function readJsonSafe(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

const email = (arg("email", "") || "").trim().toLowerCase();
const password = arg("password", "Admin@12345");
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

let users = await readJsonSafe(USERS_FILE);
if (!Array.isArray(users)) {
  // Runtime file missing/corrupt — fall back to the committed seed.
  users = (await readJsonSafe(SEED_FILE)) ?? (await readJsonSafe(SEED_FALLBACK)) ?? [];
}

let target =
  (email && users.find((u) => (u.email ?? "").toLowerCase() === email)) ||
  users.find((u) => u.role === "admin") ||
  users[0] ||
  null;

const hash = bcrypt.hashSync(password, 12);
if (!target) {
  // No admin at all — create one.
  const base = (await readJsonSafe(SEED_FILE)) ??
    (await readJsonSafe(SEED_FALLBACK)) ?? [
      {
        id: "usr_admin_abhishek",
        name: "Abhishek Prajapati",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ];
  target = {
    ...base[0],
    email: email || base[0].email || "admin@example.com",
  };
  users.push(target);
} else if (email && (target.email ?? "").toLowerCase() !== email) {
  target.email = email;
}

target.passwordHash = hash;
target.role = target.role ?? "admin";
target.tokenVersion = (target.tokenVersion ?? 1) + 1; // invalidate all live sessions

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2) + "\n", "utf8");

console.log("✓ Admin credentials reset.");
console.log(`  email:    ${target.email}`);
console.log(`  password: ${password.length ? "•".repeat(password.length) : ""} (the one you provided)`);
console.log("  All existing sessions have been invalidated.");
console.log("  Sign in at /admin/login — then change the password again from Settings.");
