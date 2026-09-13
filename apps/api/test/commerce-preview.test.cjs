const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const buyerId = "buyer-1";

function cartLine({ id, shopId, type = "PHYSICAL", quantity, price }) {
  return {
    id,
    productId: `product-${id}`,
    productVariantId: type === "PHYSICAL" ? `variant-${id}` : null,
    appPlanId: type === "PHYSICAL" ? null : `plan-${id}`,
    productType: type,
    quantity,
    product: {
      name: `Product ${id}`,
      slug: `product-${id}`,
      minPriceAmount: BigInt(price),
      shopId,
      shop: { name: `Shop ${shopId}` },
      attributes: {},
    },
    productVariant: type === "PHYSICAL" ? { name: "Default", priceAmount: BigInt(price), stockOnHand: 20, stockReserved: 0 } : null,
    appPlan: type === "PHYSICAL" ? null : { name: "Plan", priceAmount: BigInt(price), status: "ACTIVE" },
  };
}

function previewService(rows, captured, shipping) {
  return new CommerceService({
    cartItem: { findMany: async () => rows },
    checkoutSession: {
      create: async ({ data }) => {
        captured.data = data;
        return { id: "checkout-1" };
      },
    },
  }, shipping);
}

test("preview uses the configured carrier quote for each physical shop", async () => {
  const captured = {};
  const quotes = [];
  const service = previewService([
    cartLine({ id: "physical", shopId: "shop-a", quantity: 2, price: 100_000 }),
  ], captured, {
    quote: async (input) => { quotes.push(input); return { fee: 42_500, provider: "GHN", serviceId: 53320 }; },
  });

  const result = await service.preview(buyerId, {
    selectedCartItemIds: ["physical"],
    shippingAddress: { districtId: 1452, wardCode: "21012" },
  });

  assert.equal(result.shippingFee, 42_500);
  assert.equal(result.finalTotal, 242_500);
  assert.equal(quotes.length, 1);
  assert.equal(quotes[0].destination.districtId, 1452);
  assert.equal(result.shopBreakdown[0].shippingProvider, "GHN");
});

test("preview charges shipping once per physical shop and preserves exact line subtotal", async () => {
  const captured = {};
  const service = previewService([
    cartLine({ id: "one", shopId: "shop-a", quantity: 2, price: 100_000 }),
    cartLine({ id: "two", shopId: "shop-a", quantity: 1, price: 50_000 }),
  ], captured);

  const result = await service.preview(buyerId, {
    selectedCartItemIds: ["one", "two"],
    voucherCodes: ["WELCOME10"],
  });

  assert.equal(result.subtotal, 250_000);
  assert.equal(result.shippingFee, 30_000);
  assert.equal(result.finalTotal, 280_000);
  assert.equal(result.total, 280_000);
  assert.equal(result.shopBreakdown.length, 1);
  assert.deepEqual(result.shopBreakdown[0], {
    shopId: "shop-a", shopName: "Shop shop-a", subtotal: 250_000,
    shippingFee: 30_000, discount: 0, total: 280_000, items: result.shopBreakdown[0].items,
  });
  assert.equal(captured.data.snapshot.finalTotal, 280_000);
  assert.deepEqual(captured.data.snapshot.voucherCodes, ["WELCOME10"]);
  assert.equal(captured.data.snapshot.totalVoucherDiscount, 0);
});

test("preview charges each physical shop independently and never charges shipping for digital lines", async () => {
  const captured = {};
  const service = previewService([
    cartLine({ id: "physical-a", shopId: "shop-a", quantity: 1, price: 100_000 }),
    cartLine({ id: "physical-b", shopId: "shop-b", quantity: 1, price: 80_000 }),
    cartLine({ id: "digital-b", shopId: "shop-b", type: "DIGITAL_APP_ACCOUNT", quantity: 2, price: 25_000 }),
  ], captured);

  const result = await service.preview(buyerId, {
    selectedCartItemIds: ["physical-a", "physical-b", "digital-b"],
  });

  assert.equal(result.subtotal, 230_000);
  assert.equal(result.shippingFee, 60_000);
  assert.equal(result.finalTotal, 290_000);
  const shopA = result.shopBreakdown.find((shop) => shop.shopId === "shop-a");
  const shopB = result.shopBreakdown.find((shop) => shop.shopId === "shop-b");
  assert.equal(shopA.shippingFee, 30_000);
  assert.equal(shopA.total, 130_000);
  assert.equal(shopB.shippingFee, 30_000);
  assert.equal(shopB.subtotal, 130_000);
  assert.equal(shopB.total, 160_000);
  assert.equal(captured.data.snapshot.finalTotal, 290_000);
});

test("preview rejects an empty selection or changed cart instead of returning a stale total", async () => {
  const empty = previewService([], {});
  await assert.rejects(
    empty.preview(buyerId, { selectedCartItemIds: [] }),
    (error) => error.getResponse().code === "EMPTY_CHECKOUT",
  );

  const stale = previewService([cartLine({ id: "available", shopId: "shop-a", quantity: 1, price: 10_000 })], {});
  await assert.rejects(
    stale.preview(buyerId, { selectedCartItemIds: ["available", "removed"] }),
    (error) => error.getResponse().code === "CART_CHANGED",
  );
});
