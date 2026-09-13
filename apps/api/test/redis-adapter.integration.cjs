const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");
const { createAdapter } = require("@socket.io/redis-adapter");
const IORedis = require("ioredis");

test("Redis adapter forwards a room event between two API instances", { timeout: 15000 }, async () => {
  const redisUrl = process.env.REDIS_INTEGRATION_URL;
  if (!redisUrl) return test.skip("set REDIS_INTEGRATION_URL to run the multi-instance test");
  const servers = [];
  const redisClients = [];
  const sockets = [];
  try {
    for (let index = 0; index < 2; index += 1) {
      const http = createServer();
      const io = new Server(http);
      const pub = new IORedis(redisUrl);
      const sub = pub.duplicate();
      io.adapter(createAdapter(pub, sub));
      io.on("connection", (socket) => socket.on("join", (room) => socket.join(room)));
      await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
      servers.push({ http, io });
      redisClients.push(pub, sub);
    }
    for (const server of servers) {
      const address = server.http.address();
      const socket = createClient(`http://127.0.0.1:${address.port}`, { transports: ["websocket"] });
      await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
      });
      sockets.push(socket);
    }
    sockets[1].emit("join", "company-room");
    await new Promise((resolve) => setTimeout(resolve, 100));
    const received = new Promise((resolve) => sockets[1].once("notification", resolve));
    servers[0].io.to("company-room").emit("notification", { id: "cross-node" });
    assert.deepEqual(await received, { id: "cross-node" });
  } finally {
    for (const socket of sockets) socket.disconnect();
    for (const server of servers) {
      await server.io.close();
      await new Promise((resolve) => server.http.close(() => resolve()));
    }
    await Promise.all(redisClients.map((client) => client.quit().catch(() => undefined)));
  }
});
