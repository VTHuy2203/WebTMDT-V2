const assert = require("node:assert/strict");
const { io } = require("socket.io-client");

const base = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${JSON.stringify(payload)}`);
  return payload.data ?? payload;
}

async function main() {
  const health = await request("/health/ready");
  assert.equal(health.database, "up");
  assert.equal(health.redis, "up");
  assert.equal(health.objectStorage, "up");

  const session = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@marketplace.local", password: "Marketplace@123" }),
  });
  assert.ok(session.token);
  const headers = { authorization: `Bearer ${session.token}` };
  const products = await request("/products/search");
  assert.ok(Array.isArray(products));
  const orders = await request("/admin/orders", { headers });
  assert.ok(Array.isArray(orders));
  const notifications = await request("/notifications", { headers });
  assert.ok(Array.isArray(notifications));
  const socketOrigin = new URL(base).origin;
  const socket = io(`${socketOrigin}/chat`, {
    auth: { token: session.token },
    transports: ["websocket"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 5000);
    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once("connect_error", reject);
  });
  socket.disconnect();
  process.stdout.write(`Smoke test passed: ${products.length} products, ${orders.length} orders (empty state supported)\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
