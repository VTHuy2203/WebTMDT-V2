const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceController } = require("../dist/commerce/commerce.controller.js");

test("CommerceController delegates cart, checkout, payment, and order operations", async () => {
  const calls = [];
  const service = new Proxy({}, {
    get: (_target, name) => (...args) => {
      calls.push([name, ...args]);
      if (name === "payment") return { status: args[1] === "paid" ? "PAID" : "PENDING" };
      return { name, args };
    },
  });
  const controller = new CommerceController(service);
  const req = { user: { id: "buyer-1" }, headers: { "x-request-id": "request-1" } };

  assert.equal(controller.cart(req).name, "cart");
  assert.equal(controller.add(req, { productId: "product-1" }).name, "addCart");
  assert.equal(controller.update(req, "line-1", { quantity: 2 }).name, "updateCart");
  assert.equal(controller.toggle(req, "line-1").name, "toggle");
  assert.equal(controller.selectAll(req, true).name, "selectAll");
  assert.equal(controller.remove(req, "line-1").name, "removeCart");
  assert.equal(controller.preview(req, { cartItemIds: ["line-1"] }).name, "preview");
  assert.equal(controller.create(req, { addressId: "address-1" }, "idem-1").name, "createOrder");
  assert.equal(controller.createLegacy(req, {}, "legacy-explicit").name, "createOrder");
  assert.equal(controller.createLegacy(req, {}).name, "createOrder");
  assert.deepEqual(calls.at(-1).slice(-1), ["legacy-request-1"]);
  assert.deepEqual(controller.payment(req, "payment-1"), { status: "PENDING" });
  assert.deepEqual(await controller.paymentStatus(req, "paid"), { status: "PAID", isPaid: true });
  assert.deepEqual(await controller.paymentStatus(req, "pending"), { status: "PENDING", isPaid: false });
  assert.equal(controller.orders(req, "PROCESSING").name, "orders");
  assert.equal((await controller.digitalOrders(req)).name, "digitalOrders");
  assert.equal(controller.order(req, "order-1").name, "order");
  assert.equal(controller.cancel(req, "order-1").name, "cancel");
  assert.equal((await controller.received(req, "order-1")).name, "confirmReceived");

  assert.ok(calls.some((entry) => entry[0] === "selectAll" && entry[1] === "buyer-1" && entry[2] === true));
  assert.ok(calls.some((entry) => entry[0] === "orders" && entry[2] === "PROCESSING"));
});

test("payment simulator is gated and performs confirmation when explicitly enabled", async () => {
  const calls = [];
  const controller = new CommerceController({
    payment: async (_userId, id) => { calls.push(["payment", id]); return { id, status: calls.length > 1 ? "PAID" : "PENDING" }; },
    confirmPayment: async (id) => calls.push(["confirmPayment", id]),
  });
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSimulator = process.env.ALLOW_DEV_PAYMENT_SIMULATOR;
  try {
    process.env.NODE_ENV = "production";
    process.env.ALLOW_DEV_PAYMENT_SIMULATOR = "true";
    await assert.rejects(controller.simulate({ user: { id: "buyer-1" } }, "payment-1"));

    process.env.NODE_ENV = "test";
    process.env.ALLOW_DEV_PAYMENT_SIMULATOR = "false";
    await assert.rejects(controller.simulate({ user: { id: "buyer-1" } }, "payment-1"));

    process.env.ALLOW_DEV_PAYMENT_SIMULATOR = "true";
    assert.deepEqual(await controller.simulate({ user: { id: "buyer-1" } }, "payment-1"), { id: "payment-1", status: "PAID" });
    assert.deepEqual(calls, [["payment", "payment-1"], ["confirmPayment", "payment-1"], ["payment", "payment-1"]]);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSimulator === undefined) delete process.env.ALLOW_DEV_PAYMENT_SIMULATOR;
    else process.env.ALLOW_DEV_PAYMENT_SIMULATOR = previousSimulator;
  }
});

test("SePay webhook safely ignores incomplete payloads and accepts a valid fallback payload", async () => {
  const previousSecret = process.env.SEPAY_WEBHOOK_SECRET;
  process.env.SEPAY_WEBHOOK_SECRET = "webhook-secret";
  const calls = [];
  const controller = new CommerceController({
    processWebhook: async (...args) => { calls.push(args); return { accepted: true, matched: true }; },
  });
  try {
    assert.deepEqual(await controller.sepay("Bearer webhook-secret", { content: "no payment code" }), { accepted: true, matched: false });
    assert.deepEqual(await controller.sepay("Bearer webhook-secret", { content: "MPABCDEF123456", amount: 1000 }), { accepted: true, matched: false });
    assert.deepEqual(await controller.sepay("Bearer webhook-secret", { content: "MPABCDEF123456", id: "bank-1", amount: 1.5 }), { accepted: true, matched: false });
    assert.deepEqual(
      await controller.sepay("Bearer webhook-secret", { description: "MPABCDEF123456", referenceCode: "bank-2", amount: "1000" }),
      { accepted: true, matched: true },
    );
    assert.deepEqual(calls, [["MPABCDEF123456", "bank-2", 1000n]]);
  } finally {
    if (previousSecret === undefined) delete process.env.SEPAY_WEBHOOK_SECRET;
    else process.env.SEPAY_WEBHOOK_SECRET = previousSecret;
  }
});