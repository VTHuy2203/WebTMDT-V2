const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const buyerId = "00000000-0000-0000-0000-000000000001";
const variantId = "00000000-0000-0000-0000-000000000002";
const productId = "00000000-0000-0000-0000-000000000003";
const shopId = "00000000-0000-0000-0000-000000000004";

test("createOrder rejects a concurrent physical-stock loss without committing a partial order", async () => {
  const state = {
    stockOnHand: 1,
    stockReserved: 0,
    groups: [],
    orders: [],
    orderItems: [],
    reservations: [],
    paymentIntents: [],
    checkoutConsumed: false,
    cartDeleted: false,
    idempotencyRecords: [],
    outboxEvents: [],
    isolationLevel: undefined,
  };
  const checkout = {
    id: "checkout-1",
    userId: buyerId,
    consumedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    snapshot: {
      selectedCartItemIds: ["cart-item-1"],
      subtotal: 200_000,
      shippingFee: 30_000,
      finalTotal: 230_000,
      shopBreakdown: [{ shopId, subtotal: 200_000, shippingFee: 30_000, total: 230_000 }],
    },
  };
  const row = {
    productId,
    productVariantId: variantId,
    appPlanId: null,
    productType: "PHYSICAL",
    quantity: 2,
    buyerFields: {},
    product: { shopId, name: "Limited item", minPriceAmount: 100_000n },
    productVariant: { id: variantId, sku: "LIMITED", priceAmount: 100_000n },
    appPlan: null,
  };
  const db = {
    idempotencyRecord: { findFirst: async () => null },
    $transaction: async (callback, options) => {
      state.isolationLevel = options.isolationLevel;
      const draft = {
        ...state,
        groups: [], orders: [], orderItems: [], reservations: [], paymentIntents: [],
        idempotencyRecords: [], outboxEvents: [],
      };
      const tx = {
        checkoutSession: {
          findFirst: async () => checkout,
          update: async () => { draft.checkoutConsumed = true; },
        },
        cartItem: {
          findMany: async () => [row],
          deleteMany: async () => { draft.cartDeleted = true; },
        },
        orderGroup: { create: async () => { const group = { id: "group-1" }; draft.groups.push(group); return group; } },
        order: { create: async () => { const order = { id: "order-1" }; draft.orders.push(order); return order; } },
        orderItem: { create: async () => { const item = { id: "order-item-1" }; draft.orderItems.push(item); return item; } },
        $executeRaw: async (_strings, ...values) => {
          const quantity = values.at(-1);
          if (draft.stockOnHand - draft.stockReserved < quantity) return 0;
          draft.stockReserved += quantity;
          return 1;
        },
        inventoryReservation: { create: async ({ data }) => { draft.reservations.push(data); } },
        paymentIntent: { create: async () => { const intent = { id: "payment-1" }; draft.paymentIntents.push(intent); return intent; } },
        idempotencyRecord: { create: async ({ data }) => { draft.idempotencyRecords.push(data); } },
        outboxEvent: { create: async ({ data }) => { draft.outboxEvents.push(data); } },
        inventoryItem: {},
      };
      try {
        const result = await callback(tx);
        Object.assign(state, draft);
        return result;
      } catch (error) {
        throw error;
      }
    },
  };
  const service = new CommerceService(db);

  await assert.rejects(
    service.createOrder(buyerId, { checkoutSessionId: checkout.id, paymentMethod: "SEPAY" }, "race-key-001"),
    (error) => error.getResponse().code === "INVENTORY_OUT_OF_STOCK",
  );

  assert.equal(state.stockReserved, 0);
  assert.deepEqual(state.groups, []);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.orderItems, []);
  assert.deepEqual(state.reservations, []);
  assert.deepEqual(state.paymentIntents, []);
  assert.equal(state.checkoutConsumed, false);
  assert.equal(state.cartDeleted, false);
  assert.deepEqual(state.idempotencyRecords, []);
  assert.deepEqual(state.outboxEvents, []);
  assert.equal(state.isolationLevel, "Serializable");
});

test("cancel releases each physical reservation, releases digital inventory, and closes the whole order group", async () => {
  const state = {
    variants: new Map([
      ["variant-a", { stockReserved: 2, version: 4 }],
      ["variant-b", { stockReserved: 1, version: 9 }],
    ]),
    reservations: [
      { id: "reservation-a", orderGroupId: "group-1", productVariantId: "variant-a", quantity: 2, status: "ACTIVE", activeKey: "ACTIVE" },
      { id: "reservation-b", orderGroupId: "group-1", productVariantId: "variant-b", quantity: 1, status: "ACTIVE", activeKey: "ACTIVE" },
      { id: "reservation-digital", orderGroupId: "group-1", inventoryItemId: "inventory-1", quantity: 1, status: "ACTIVE", activeKey: "ACTIVE" },
    ],
    inventoryReleased: false,
    ordersCancelled: false,
    groupCancelled: false,
    paymentExpired: false,
  };
  const order = { id: "order-1", orderGroupId: "group-1", status: "PENDING_PAYMENT" };
  const db = {
    order: { findFirst: async () => order },
    $transaction: async (callback) => callback({
      inventoryReservation: {
        findMany: async () => state.reservations.filter((reservation) => reservation.status === "ACTIVE"),
        updateMany: async ({ data }) => {
          state.reservations.forEach((reservation) => {
            if (reservation.status === "ACTIVE") Object.assign(reservation, data);
          });
        },
      },
      productVariant: {
        update: async ({ where, data }) => {
          const variant = state.variants.get(where.id);
          variant.stockReserved -= data.stockReserved.decrement;
          variant.version += data.version.increment;
        },
      },
      inventoryItem: { updateMany: async () => { state.inventoryReleased = true; } },
      order: { updateMany: async () => { state.ordersCancelled = true; } },
      orderGroup: { update: async () => { state.groupCancelled = true; } },
      paymentIntent: { updateMany: async () => { state.paymentExpired = true; } },
    }),
  };
  const service = new CommerceService(db);
  service.order = async () => ({ id: order.id, status: "CANCELLED" });

  const response = await service.cancel(buyerId, order.id);

  assert.deepEqual(response, { id: order.id, status: "CANCELLED" });
  assert.deepEqual(state.variants.get("variant-a"), { stockReserved: 0, version: 5 });
  assert.deepEqual(state.variants.get("variant-b"), { stockReserved: 0, version: 10 });
  assert.equal(state.inventoryReleased, true);
  assert.equal(state.ordersCancelled, true);
  assert.equal(state.groupCancelled, true);
  assert.equal(state.paymentExpired, true);
  for (const reservation of state.reservations) {
    assert.equal(reservation.status, "RELEASED");
    assert.equal(reservation.activeKey, null);
    assert.ok(reservation.releasedAt instanceof Date);
  }
});
