import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { postgresStore } from "./postgres";
import { seedFor } from "./seeds";

// Local/Docker: atomic JSON files on a persistent volume. Serverless: a
// shared Postgres database is REQUIRED for writes (a /tmp file is NOT durable).
// Static seed imports provide first-boot content for either backend without
// causing Next.js to trace the entire project into every function.
export const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
);

export class StorageConfigurationError extends Error {
  constructor(message = "Persistent storage is not configured. Set DATABASE_URL to a Postgres connection string and redeploy (see README → Serverless deployment). Dashboard writes and password changes cannot use serverless /tmp storage.") {
    super(message);
  }
}

export function assertWritableStore(): void {
  if (IS_SERVERLESS && !process.env.DATABASE_URL) throw new StorageConfigurationError();
}

const DATA_DIR = process.env.DATA_DIR ??
  (IS_SERVERLESS ? path.join(os.tmpdir(), "apportfolio", "data") : path.join(process.cwd(), "data"));
const UPLOADS_DIR = process.env.UPLOADS_DIR ??
  (IS_SERVERLESS ? path.join(os.tmpdir(), "apportfolio", "uploads") : path.join(process.cwd(), "public", "uploads"));

const locks = new Map<string, Promise<unknown>>();

async function withLock<T>(file: string, task: () => Promise<T>): Promise<T> {
  const prev = locks.get(file) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(task);
  const done = run.catch(() => undefined);
  locks.set(file, done);
  void done.then(() => { if (locks.get(file) === done) locks.delete(file); });
  return run;
}

export function dataPath(name: string): string {
  // Collection names are taken ONLY from the static seed map, not from a URL.
  seedFor(name);
  return path.join(DATA_DIR, name);
}

async function ensureSeeded(name: string): Promise<void> {
  const target = dataPath(name);
  await fs.mkdir(DATA_DIR, { recursive: true });
  // wx avoids clobbering a file another request seeded simultaneously.
  try {
    await fs.writeFile(target, JSON.stringify(seedFor(name), null, 2) + "\n", { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  // Keep the repository API, but never mask corruption/missing storage as a
  // successful read of an empty fallback collection.
  void fallback;
  const seed = seedFor<T>(name);
  if (process.env.DATABASE_URL) return postgresStore().read(name, seed);
  // Public pages may still serve the committed content if a serverless deploy
  // has not configured its database. Admin login/writes fail explicitly (503).
  if (IS_SERVERLESS) return seed;
  await ensureSeeded(name);
  return JSON.parse(await fs.readFile(dataPath(name), "utf8")) as T;
}

export async function writeJson(name: string, value: unknown): Promise<void> {
  assertWritableStore();
  if (process.env.DATABASE_URL) {
    await postgresStore().update(name, seedFor(name), () => value);
    return;
  }
  const target = dataPath(name);
  await withLock(target, async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
      await fs.rename(tmp, target);
    } catch (err) {
      await fs.unlink(tmp).catch(() => undefined);
      throw err;
    }
  });
}

/** Atomic read → mutate → write. Postgres uses CAS with retries across replicas. */
export async function updateJson<T>(
  name: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  void fallback;
  assertWritableStore();
  if (process.env.DATABASE_URL) return postgresStore().update(name, seedFor<T>(name), mutate);
  const target = dataPath(name);
  return withLock(target, async () => {
    await ensureSeeded(name);
    // A corrupt runtime file must fail visibly, not silently replace edits
    // with the seed or an empty table.
    const current = JSON.parse(await fs.readFile(target, "utf8")) as T;
    const next = await mutate(current);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
      await fs.rename(tmp, target);
    } catch (err) {
      await fs.unlink(tmp).catch(() => undefined);
      throw err;
    }
    return next;
  });
}

export const paths = {
  dataDir: DATA_DIR,
  tmpDir: path.join(DATA_DIR, ".tmp-uploads"),
  uploads: UPLOADS_DIR,
  mediaUploads: path.join(UPLOADS_DIR, "media"),
  buildUploads: path.join(UPLOADS_DIR, "builds"),
};

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
