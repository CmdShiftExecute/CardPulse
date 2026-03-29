import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  const defaultPath = "./data/cardpulse.db";

  // On Vercel, the filesystem is read-only except /tmp.
  // Copy the pre-built demo DB to /tmp so SQLite can write WAL files.
  if (process.env.VERCEL) {
    const tmpPath = "/tmp/cardpulse.db";
    if (!fs.existsSync(tmpPath) && fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, tmpPath);
    }
    return tmpPath;
  }

  return defaultPath;
}

const DB_PATH = resolveDbPath();

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
