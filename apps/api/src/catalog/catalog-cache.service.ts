import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createHash } from "crypto";
import IORedis from "ioredis";

@Injectable()
export class CatalogCacheService implements OnModuleDestroy {
  private readonly redisUrl = process.env.REDIS_URL;
  private readonly redis = this.redisUrl
    ? new IORedis(this.redisUrl, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })
    : null;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor() {
    this.redis?.on("error", () => undefined);
  }

  private async version() {
    if (!this.redis) return "disabled";
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      // A missing counter is generation 0; the first INCR must therefore
      // advance to generation 1 instead of reusing existing generation keys.
      return (await this.redis.get("catalog:version")) ?? "0";
    } catch {
      return "unavailable";
    }
  }

  async getOrSet<T>(scope: string, input: unknown, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    const version = await this.version();
    if (!this.redis || version === "unavailable" || version === "disabled") return load();
    const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const key = `catalog:${version}:${scope}:${digest}`;
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch {
      return load();
    }

    const running = this.inFlight.get(key) as Promise<T> | undefined;
    if (running) return running;
    const promise = load()
      .then(async (value) => {
        try {
          await this.redis!.set(key, JSON.stringify(value), "EX", ttlSeconds);
        } catch {
          // Cache is fail-open: Redis must never make catalog unavailable.
        }
        return value;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  async invalidate() {
    if (!this.redis) return;
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      await this.redis.incr("catalog:version");
    } catch {
      // The outbox search sync remains authoritative when Redis is unavailable.
    }
  }

  async onModuleDestroy() {
    if (this.redis && ["ready", "connect", "connecting"].includes(this.redis.status))
      await this.redis.quit().catch(() => undefined);
  }
}
