import { Redis } from "@upstash/redis";
import type { DbShape } from "@/lib/types";

const DB_KEY = "rc-care:db";

type RemoteClient = {
  get: () => Promise<DbShape | null>;
  set: (db: DbShape) => Promise<void>;
};

let client: RemoteClient | null | undefined;

function redisFromEnv(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_TOKEN;
  if (!url || !token) return null;
  // REDIS_URL sometimes is redis:// — Upstash REST needs https REST URL
  if (!url.startsWith("http")) return null;
  return new Redis({ url, token });
}

export function hasRemoteDb(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      (process.env.REDIS_URL?.startsWith("http") &&
        (process.env.KV_REST_API_TOKEN ||
          process.env.UPSTASH_REDIS_REST_TOKEN ||
          process.env.REDIS_TOKEN)),
  );
}

function getClient(): RemoteClient | null {
  if (client !== undefined) return client;
  const redis = redisFromEnv();
  if (!redis) {
    client = null;
    return null;
  }
  client = {
    async get() {
      const raw = await redis.get<DbShape | string>(DB_KEY);
      if (!raw) return null;
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw) as DbShape;
        } catch {
          return null;
        }
      }
      return raw as DbShape;
    },
    async set(db: DbShape) {
      // Store as JSON string for consistent round-trip size/control
      await redis.set(DB_KEY, JSON.stringify(db));
    },
  };
  return client;
}

export async function remoteReadDb(): Promise<DbShape | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.get();
  } catch (err) {
    console.error("[db-remote] read failed", err);
    return null;
  }
}

export async function remoteWriteDb(db: DbShape): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.set(db);
    return true;
  } catch (err) {
    console.error("[db-remote] write failed", err);
    return false;
  }
}

export function remoteStoreLabel(): string {
  if (process.env.KV_REST_API_URL) return "vercel-kv";
  if (process.env.UPSTASH_REDIS_REST_URL) return "upstash";
  if (process.env.REDIS_URL?.startsWith("http")) return "redis-rest";
  return "none";
}
