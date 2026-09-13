import { INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";
import type { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
  private pubClient?: IORedis;
  private subClient?: IORedis;

  constructor(app: INestApplicationContext, private readonly redisUrl: string) {
    super(app);
  }

  async connect() {
    this.pubClient = new IORedis(this.redisUrl, { maxRetriesPerRequest: null });
    this.subClient = this.pubClient.duplicate();
    await Promise.all([
      this.pubClient.status === "wait" ? this.pubClient.connect() : Promise.resolve(),
      this.subClient.status === "wait" ? this.subClient.connect() : Promise.resolve(),
    ]);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (!this.pubClient || !this.subClient) throw new Error("Redis Socket.IO adapter is not connected");
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }

  async close() {
    await Promise.all([
      this.pubClient?.quit().catch(() => undefined),
      this.subClient?.quit().catch(() => undefined),
    ]);
  }
}
