const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const now = new Date("2026-01-01T00:00:00.000Z");

function physicalOrder(overrides = {}) {
  return {
    id: "order-1",
    code: "OD-1",
    shopId: "shop-1",
    status: "PAID",
    subtotalAmount: 100n,
    shippingAmount: 10n,
    discountAmount: 0n,
    totalAmount: 110n,
    currency: "VND",
    createdAt: now,
    updatedAt: now,
    shippingAddress: {
      addressId: "address-1",
      fullName: "Buyer",
      phoneNumber: "0900",
      province: "Province",
      district: "District",
      ward: "Ward",
      street: "Street",
      detail: "Detail",
      label: "OFFICE",
    },
    shipment: { provider: "Carrier", trackingNumber: "TRACK-1" },
    shop: { id: "shop-1", name: "Shop", slug: "shop", ratingAverage: null },
    group: { buyerId: "buyer-1", paymentIntents: [{ status: "PAID", provider: "COD" }] },
    items: [{
      id: "item-1",
      productId: "product-1",
      productVariantId: null,
      appPlanId: "plan-1",
      productType: "DIGITAL",
      quantity: 1,
      unitPriceAmount: 100n,
      totalAmount: 100n,
      snapshot: { productName: "Product", planName: "Plan" },
      product: null,
      productVariant: null,
    }],
    ...overrides,
  };
}

function digitalOrder(status, deliveryStatus) {
  return {
    id: `digital-${status}`,
    code: "DG-1",
    status,
    totalAmount: 200n,
    currency: "VND",
    createdAt: now,
    group: {
      buyer: { fullName: "Buyer One" },
      paymentIntents: status === "PENDING_PAYMENT" ? [] : [{ status: "PAID" }],
    },
    items: deliveryStatus === "NO_ITEM" ? [] : [{
      productType: "DIGITAL_APP_ACCOUNT",
      quantity: 2,
      snapshot: deliveryStatus === "SPARSE" ? null : { productName: "Digital Product", planName: "Premium", fulfillmentType: "ACCOUNT" },
      product: deliveryStatus === "SPARSE" ? null : { attributes: { images: ["cover.png"], gameName: "Game" } },
      deliveries: deliveryStatus === "NONE" ? [] : [{ status: deliveryStatus }],
    }],
    disputes: deliveryStatus === "SPARSE" ? [] : [{ status: "OPEN" }],
  };
}

test("commerce query variants cover list filters, missing detail, and admin serialization", async () => {
  const queries = [];
  const db = {
    order: {
      findMany: async (query) => { queries.push(query); return [physicalOrder()]; },
      findFirst: async () => null,
    },
  };
  const service = new CommerceService(db);

  assert.equal((await service.orders("buyer-1"))[0].paymentMethod, "COD");
  assert.equal((await service.orders("buyer-1", "ALL"))[0].shop.rating, 0);
  assert.equal((await service.sellerOrders("seller-1"))[0].trackingCode, "TRACK-1");
  assert.equal((await service.sellerOrders("seller-1", "ALL"))[0].shippingAddress.recipientName, "Buyer");
  assert.equal((await service.adminOrders())[0].items[0].variantName, "Plan");
  await assert.rejects(service.order("buyer-1", "missing"), (error) => error.getStatus() === 404);

  assert.deepEqual(queries[0].where, { group: { buyerId: "buyer-1" } });
  assert.deepEqual(queries[1].where, { group: { buyerId: "buyer-1" } });
  assert.deepEqual(queries[2].where, { shop: { members: { some: { userId: "seller-1" } } } });
});

test("digital order lists serialize sparse, ready, and completed delivery states", async () => {
  const queries = [];
  const rows = [
    digitalOrder("PENDING_PAYMENT", "NO_ITEM"),
    digitalOrder("PAID", "NONE"),
    digitalOrder("PROCESSING", "READY"),
    digitalOrder("COMPLETED", "REVEALED"),
    digitalOrder("PAID", "SPARSE"),
  ];
  const service = new CommerceService({
    order: { findMany: async (query) => { queries.push(query); return rows; } },
  });

  const buyer = await service.digitalOrders("buyer-1");
  assert.equal(buyer[0].productName, "Sản phẩm số");
  assert.equal(buyer[0].quantity, 0);
  assert.equal(buyer[0].paymentStatus, "PENDING");
  assert.equal(buyer[0].deliveryStatus, "NOT_AVAILABLE");
  assert.equal(buyer[1].deliveryStatus, "PREPARING");
  assert.equal(buyer[2].allowedActions.revealDelivery, true);
  assert.equal(buyer[3].allowedActions.confirmReceived, true);
  assert.equal(buyer[3].allowedActions.review, true);
  assert.equal(buyer[4].productThumbnail, "");

  const sellerAll = await service.sellerDigitalOrders("seller-1", false);
  const sellerApps = await service.sellerDigitalOrders("seller-1", true);
  assert.equal(sellerAll[0].buyerName, "Buyer One");
  assert.equal(sellerApps[0].buyerName, "Buyer One");
  assert.deepEqual(queries[1].where.items, { some: { productType: { not: "PHYSICAL" } } });
  assert.deepEqual(queries[2].where.items, { some: { productType: "DIGITAL_APP_ACCOUNT" } });
});

test("payment mapping covers COD, QR defaults, configured bank data, and missing payment", async () => {
  const previous = {
    bank: process.env.SEPAY_BANK_NAME,
    account: process.env.SEPAY_ACCOUNT_NUMBER,
    holder: process.env.SEPAY_ACCOUNT_HOLDER,
  };
  let current = null;
  const service = new CommerceService({
    paymentIntent: { findFirst: async () => current },
  });
  try {
    await assert.rejects(service.payment("buyer-1", "missing"), (error) => error.getStatus() === 404);

    current = {
      id: "payment-1",
      orderGroupId: "group-1",
      amount: 123n,
      provider: "COD",
      status: "PENDING",
      paidAt: null,
      createdAt: now,
      expiresAt: now,
      paymentCode: "MPABCDEF123456",
    };
    delete process.env.SEPAY_BANK_NAME;
    delete process.env.SEPAY_ACCOUNT_NUMBER;
    delete process.env.SEPAY_ACCOUNT_HOLDER;
    const cod = await service.payment("buyer-1", "payment-1");
    assert.equal(cod.method, "COD");
    assert.equal(cod.paidAt, undefined);
    assert.equal(cod.sepayInfo.bankName, "MBBank");

    process.env.SEPAY_BANK_NAME = "Test Bank";
    process.env.SEPAY_ACCOUNT_NUMBER = "123 456";
    process.env.SEPAY_ACCOUNT_HOLDER = "Test Holder";
    current = { ...current, provider: "SEPAY", status: "PAID", paidAt: now };
    const qr = await service.payment("buyer-1", "payment-1");
    assert.equal(qr.method, "SEPAY_QR");
    assert.equal(qr.paidAt, now.toISOString());
    assert.equal(qr.sepayInfo.bankName, "Test Bank");
    assert.match(qr.sepayInfo.qrUrl, /123%20456/);
  } finally {
    for (const [name, value] of Object.entries({
      SEPAY_BANK_NAME: previous.bank,
      SEPAY_ACCOUNT_NUMBER: previous.account,
      SEPAY_ACCOUNT_HOLDER: previous.holder,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("cart mutations cover successful digital addition, toggle, select-all, and invalid plan", async () => {
  const writes = [];
  const product = { id: "product-1", status: "ACTIVE", type: "DIGITAL_APP_ACCOUNT", variants: [], appPlans: [{ id: "plan-1" }] };
  const db = {
    product: { findUnique: async () => product },
    cart: {
      findFirst: async () => ({ id: "cart-1" }),
      upsert: async () => ({ id: "cart-1" }),
    },
    cartItem: {
      create: async (query) => writes.push(["create", query]),
      findFirst: async () => ({ id: "line-1", selected: false }),
      update: async (query) => writes.push(["update", query]),
      updateMany: async (query) => writes.push(["updateMany", query]),
    },
  };
  const service = new CommerceService(db);
  service.cart = async () => [];

  await service.addCart("buyer-1", { productId: "product-1", variantId: "plan-1", buyerProvidedValues: { username: "buyer" } });
  await service.toggle("buyer-1", "line-1");
  await service.selectAll("buyer-1", false);
  assert.equal(writes[0][1].data.quantity, 1);
  assert.equal(writes[0][1].data.appPlanId, "plan-1");
  assert.deepEqual(writes[1][1].data, { selected: true });
  assert.deepEqual(writes[2][1].data, { selected: false });

  await assert.rejects(
    service.addCart("buyer-1", { productId: "product-1", variantId: "missing-plan" }),
    (error) => error.getResponse().code === "INVALID_PLAN",
  );
});
