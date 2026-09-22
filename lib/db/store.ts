import { promises as fs } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Low-level JSON store for the flat-file database.
//
// - All reads/writes go through the repositories in lib/db/repos.ts.
// - Writes are serialized per-file through a promise-chain mutex and are
//   atomic (write temp file → rename), so concurrent admin operations can't
//   produce torn JSON.
// - Runtime data files live in /data (gitignored). If a runtime file is
//   missing, the committed seed example in /data/seed is copied over — which
//   makes a fresh deploy self-seeding.
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const SEED_DIR = path.join(DATA_DIR, "seed");
/**
 * Deploy-safe seed fallback. In Docker / standalone servers the runtime
 * `data/` directory is a mounted volume (empty on first boot) that shadows any
 * image files under it — so the image ALSO bakes the seed examples at
 * <app>/seed-defaults (see Dockerfile) and we look there second. Override with
 * the SEED_DIR env var if you move them.
 */
const SEED_FALLBACK_DIR = process.env.SEED_DIR ?? path.join(process.cwd(), "seed-defaults");
const TMP_DIR = path.join(DATA_DIR, ".tmp-uploads");

const locks = new Map<string, Promise<unknown>>();

/** Serialize async work per file path. */
async function withLock<T>(file: string, task: () => Promise<T>): Promise<T> {
  const prev = locks.get(file) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(task);
  locks.set(
    file,
    run.catch(() => undefined),
  );
  return run;
}

export function dataPath(name: string): string {
  return path.join(DATA_DIR, name);
}

async function ensureSeeded(name: string): Promise<void> {
  const target = dataPath(name);
  try {
    await fs.access(target);
    return;
  } catch {
    // missing — try to seed
  }
  const seedName = name.replace(/\.json$/, ".seed.json");
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let source = path.join(SEED_DIR, seedName);
    try {
      await fs.access(source);
    } catch {
      const fallback = path.join(SEED_FALLBACK_DIR, seedName);
      await fs.access(fallback);
      source = fallback;
    }
    await fs.copyFile(source, target);
  } catch (err) {
    // If there is no seed, create a sensible empty default.
    const empty = name === "settings.json" ? "{}" : "[]";
    await fs.writeFile(target, empty, "utf8").catch(() => undefined);
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.error(`[db] failed to seed ${name}:`, err);
    }
  }
}

/** Overwrite a runtime data file with its committed seed (self-healing). */
export async function reseedCollection(name: string): Promise<boolean> {
  const target = dataPath(name);
  const seedName = name.replace(/\.json$/, ".seed.json");
  for (const source of [path.join(SEED_DIR, seedName), path.join(SEED_FALLBACK_DIR, seedName)]) {
    try {
      await fs.copyFile(source, target);
      return true;
    } catch { /* try next */ }
  }
  return false;
}

/** Read and parse a JSON data file. Returns `fallback` if unreadable/corrupt. */
export async function readJson<T>(name: string, fallback: T): Promise<T> {
  await ensureSeeded(name);
  try {
    const raw = await fs.readFile(dataPath(name), "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[db] read failed for ${name} — using fallback:`, err);
    return fallback;
  }
}

/** Atomically write a JSON data file (serialized per file). */
export async function writeJson(name: string, value: unknown): Promise<void> {
  const target = dataPath(name);
  await withLock(target, async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
      await fs.rename(tmp, target);
    } catch (err) {
      await fs.unlink(tmp).catch(() => undefined);
      // Write failures risk data loss — surface loudly.
      console.error(`[db] WRITE FAILED for ${name}:`, err);
      throw err;
    }
  });
}

/** Read → mutate → write in one serialized transaction. */
export async function updateJson<T>(
  name: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  const target = dataPath(name);
  return withLock(target, async () => {
    await ensureSeeded(name);
    let current: T;
    try {
      current = JSON.parse(await fs.readFile(target, "utf8")) as T;
    } catch {
      current = fallback;
    }
    const next = await mutate(current);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
      await fs.rename(tmp, target);
    } catch (err) {
      await fs.unlink(tmp).catch(() => undefined);
      console.error(`[db] WRITE FAILED for ${name}:`, err);
      throw err;
    }
    return next;
  });
}

export const paths = {
  dataDir: DATA_DIR,
  tmpDir: TMP_DIR,
  uploads: path.join(process.cwd(), "public", "uploads"),
  mediaUploads: path.join(process.cwd(), "public", "uploads", "media"),
  buildUploads: path.join(process.cwd(), "public", "uploads", "builds"),
};

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
