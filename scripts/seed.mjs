#!/usr/bin/env node
/**
 * Seed script — initializes runtime JSON data from committed seed examples.
 *
 * Usage:
 *   node scripts/seed.mjs                 # copy any missing seed files into data/
 *   ADMIN_PASSWORD=Secret123 node scripts/seed.mjs --reset-admin
 *                                          # re-create the admin user with a new password
 *
 * The app also self-seeds on first read (see lib/db/store.ts), so running this
 * is only strictly required when you want to set a custom admin password.
 */
import { existsSync, copyFileSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const seedDir = join(dataDir, "seed");

mkdirSync(dataDir, { recursive: true });

let copied = 0;
for (const file of readdirSync(seedDir)) {
  if (!file.endsWith(".seed.json")) continue;
  const target = join(dataDir, file.replace(".seed.json", ".json"));
  if (!existsSync(target)) {
    copyFileSync(join(seedDir, file), target);
    copied++;
    console.log(`  + seeded ${file.replace(".seed.json", ".json")}`);
  }
}
console.log(copied === 0 ? "All data files already exist." : `Seeded ${copied} file(s).`);

if (process.argv.includes("--reset-admin")) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error("Provide ADMIN_PASSWORD (min 8 chars) in the environment.");
    process.exit(1);
  }
  const usersPath = join(dataDir, "users.json");
  const users = JSON.parse(readFileSync(usersPath, "utf8"));
  users[0].passwordHash = bcrypt.hashSync(password, 12);
  users[0].tokenVersion = (users[0].tokenVersion ?? 1) + 1; // invalidate existing sessions
  writeFileSync(usersPath, JSON.stringify(users, null, 2) + "\n");
  console.log("Admin password updated. All existing sessions have been logged out.");
}
