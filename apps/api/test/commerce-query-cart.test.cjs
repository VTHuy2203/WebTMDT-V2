const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const buyerId = "buyer-1";
const sellerId = "seller-1";

function orderFixture() {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    id: "order-1", orderGroupId: "group-1", code: "OD-1", shopId: "shop-1", status: "PENDING_PAYMENT",
    subtotalAmount: 100_000n, shippingAmount: 30_000n, discountAmount: 0n, totalAmount: 130_000n,
    currency: "VND", createdAt: now, updatedAt: now, shippingAddress: null, shipment: null,
    shop: { id: "shop-1", name: "Shop One", slug: "shop-one", ratingAverage: 5 },
    group: { buyerId, paymentIntents: [{ status: "PENDING", provider: "SEPAY" }] },
    items: [{ id: "item-1", productId: "product-1", productVariantId: "variant-1", appPlanId: null, productType: "PHYSICAL", quantity: 1, unitPriceAmount: 100_000n, totalAmount: 100_000n, snapshot: { productName: "Product" }, product: { slug: "product", attributes: {} }, productVariant: { name: "Default" } }],
  };
}

test("cart reads only the active cart and groups lines by shop", async () => {
  let cartLookup;
  const db = {
    cart: {
      findFirst: async (query) => { cartLookup = query; return { id: "cart-active" }; },
      upsert: async () => ({ id: "cart-active" }),
    },
    cartItem: {
      findMany: async ({ where }) => {
        assert.deepEqual(where, { cartId: "cart-active" });
        return [1, 2].map((quantity, index) => ({
          id: `line-${index}`, productId: `product-${index}`, productVariantId: `variant-${index}`, appPlanId: null,
          productType: "PHYSICAL", quantity, selected: true,
          product: { name: "Product", slug: "product", minPriceAmount: 50_000n, shopId: "shop-1", shop: { name: "Shop" }, attributes: {} },
          productVariant: { name: "Default", priceAmount: 50_000n, stockOnHand: 10, stockReserved: 0 }, appPlan: null,
        }));
      },
    },
  };
  const result = await new CommerceService(db).cart(buyerId);
  assert.deepEqual(cartLookup.where, { userId: buyerId, status: "ACTIVE" });
  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 2);
  assert.equal(result[0].subtotal, 150_000);
});

test("cart update and remove reject an item outside the buyer active cart", async () => {
  let writes = 0;
  const db = { cartItem: {
    findFirst: async (query) => { assert.deepEqual(query.where, { id: "foreign-line", cart: { userId: buyerId, status: "ACTIVE" } }); return null; },
    update: async () => { writes += 1; }, delete: async () => { writes += 1; },
  } };
  const service = new CommerceService(db);
  await assert.rejects(service.updateCart(buyerId, "foreign-line", { quantity: 2 }), (error) => error.getStatus() === 404);
  await assert.rejects(service.removeCart(buyerId, "foreign-line"), (error) => error.getStatus() === 404);
  assert.equal(writes, 0);
});

test("cart update persists quantity/selection and remove deletes the owned cart line", async () => {
  const writes = [];
  const db = { cartItem: {
    findFirst: async () => ({ id: "owned-line", selected: false }),
    update: async (query) => writes.push({ operation: "update", ...query }),
    delete: async (query) => writes.push({ operation: "delete", ...query }),
  } };
  const service = new CommerceService(db);
  service.cart = async () => [{ shopId: "shop-1" }];
  await service.updateCart(buyerId, "owned-line", { quantity: 3, selected: true });
  await service.removeCart(buyerId, "owned-line");
  assert.deepEqual(writes, [
    { operation: "update", where: { id: "owned-line" }, data: { quantity: 3, selected: true } },
    { operation: "delete", where: { id: "owned-line" } },
  ]);
});

test("buyer order list and detail always scope queries to the authenticated buyer", async () => {
  const queries = [];
  const db = { order: {
    findMany: async (query) => { queries.push(query); return [orderFixture()]; },
    findFirst: async (query) => { queries.push(query); return orderFixture(); },
  } };
  const service = new CommerceService(db);
  const list = await service.orders(buyerId, "PAID");
  const detail = await service.order(buyerId, "group-1");
  assert.equal(list[0].id, "order-1");
  assert.equal(detail.id, "order-1");
  assert.deepEqual(queries[0].where, { group: { buyerId }, status: "PAID" });
  assert.deepEqual(queries[1].where, { OR: [{ id: "group-1" }, { orderGroupId: "group-1" }], group: { buyerId } });
});

test("seller order list scopes access to an active shop membership predicate", async () => {
  let query;
  const db = { order: { findMany: async (input) => { query = input; return [orderFixture()]; } } };
  const result = await new CommerceService(db).sellerOrders(sellerId, "PENDING_PAYMENT");
  assert.equal(result[0].id, "order-1");
  assert.deepEqual(query.where, { shop: { members: { some: { userId: sellerId } } }, status: "PENDING_PAYMENT" });
});
