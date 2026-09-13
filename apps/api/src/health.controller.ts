import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "./prisma.service";
import { StorageService } from "./platform/storage.service";
import { ProductSearchService } from "./catalog/product-search.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly storage: StorageService,
    private readonly search: ProductSearchService,
  ) {}
  @Get("live") live() {
    return { status: "ok" };
  }
  @Get("ready") async ready() {
    const checks: Record<string, string> = {};
    try {
      await this.db.$queryRaw`SELECT 1`;
      checks.database = "up";
      const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
        lazyConnect: true,
        connectTimeout: 1500,
        maxRetriesPerRequest: 0,
      });
      await redis.connect();
      await redis.ping();
      redis.disconnect();
      checks.redis = "up";
      checks.objectStorage = await this.storage.health();
      checks.search = await this.search.health();
    } catch (error) {
      throw new ServiceUnavailableException({
        code: "DEPENDENCY_UNAVAILABLE",
        message: "Một dịch vụ phụ thuộc chưa sẵn sàng",
        details: { ...checks, error: (error as Error).message },
      });
    }
    return { status: "ready", ...checks };
  }
}
