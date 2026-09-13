const test = require("node:test");
const assert = require("node:assert/strict");
const { hash } = require("argon2");
const { AuthService } = require("../dist/auth/auth.service.js");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const buyerId = "00000000-0000-0000-0000-000000000001";

test("addCart rejects an invalid physical variant before writing a cart item", async () => {
  let cartItemCreated = false;
  const db = {
    product: {
      findUnique: async () => ({
        id: "product-1",
        status: "ACTIVE",
        type: "PHYSICAL",
        variants: [{ id: "variant-1" }],
        appPlans: [],
      }),
    },
    cart: {
      findFirst: async () => ({ id: "cart-1" }),
      upsert: async () => ({ id: "cart-1" }),
    },
    cartItem: {
      create: async () => { cartItemCreated = true; },
      findMany: async () => [],
    },
  };
  const service = new CommerceService(db);

  await assert.rejects(
    service.addCart(buyerId, { productId: "product-1", productVariantId: "other", quantity: 1 }),
    (error) => error.getResponse().code === "INVALID_VARIANT",
  );
  assert.equal(cartItemCreated, false);
});

test("addCart rejects quantities outside the business limit before writing a cart item", async () => {
  let cartItemCreated = false;
  const db = {
    product: {
      findUnique: async () => ({
        id: "product-1",
        status: "ACTIVE",
        type: "PHYSICAL",
        variants: [{ id: "variant-1" }],
        appPlans: [],
      }),
    },
    cart: {
      findFirst: async () => ({ id: "cart-1" }),
      upsert: async () => ({ id: "cart-1" }),
    },
    cartItem: { create: async () => { cartItemCreated = true; } },
  };
  const service = new CommerceService(db);

  await assert.rejects(
    service.addCart(buyerId, { productId: "product-1", productVariantId: "variant-1", quantity: 100 }),
    (error) => error.getResponse().code === "INVALID_QUANTITY",
  );
  assert.equal(cartItemCreated, false);
});

test("five failed logins lock the account", async () => {
  const user = {
    id: buyerId,
    status: "ACTIVE",
    passwordHash: await hash("correct-password"),
    failedLoginCount: 0,
    lockedUntil: null,
    roles: [],
  };
  const db = {
    user: {
      findUnique: async () => user,
      update: async ({ data }) => Object.assign(user, data),
    },
  };
  const service = new AuthService(db, {}, {});

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(service.login({ email: "buyer@example.test", password: "wrong-password" }));
  }

  assert.equal(user.failedLoginCount, 0);
  assert.ok(user.lockedUntil instanceof Date);
  assert.ok(user.lockedUntil > new Date());
});

test("refresh token reuse revokes the entire token family", async () => {
  const revoked = [];
  const db = {
    session: {
      findUnique: async () => ({
        id: "session-1",
        tokenFamilyId: "family-1",
        refreshTokenHash: await hash("different-token"),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user: { id: buyerId, roles: [] },
      }),
      updateMany: async (query) => revoked.push(query),
    },
  };
  const jwt = { verifyAsync: async () => ({ sid: "session-1" }) };
  const service = new AuthService(db, jwt, {});

  await assert.rejects(
    service.refresh("reused-token"),
    (error) => error.getResponse().code === "INVALID_REFRESH_TOKEN",
  );
  assert.equal(revoked.length, 1);
  assert.deepEqual(revoked[0].where, { tokenFamilyId: "family-1" });
  assert.ok(revoked[0].data.revokedAt instanceof Date);
  assert.ok(revoked[0].data.reuseDetectedAt instanceof Date);
});

test("password reset revokes all active sessions", async () => {
  const token = "a-valid-password-reset-token-value";
  const updates = [];
  const db = {
    accountToken: {
      findUnique: async () => ({
        id: "reset-1",
        userId: buyerId,
        type: "PASSWORD_RESET",
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      update: async (query) => { updates.push(query); return query; },
    },
    user: { update: async (query) => { updates.push(query); return query; } },
    session: { updateMany: async (query) => { updates.push(query); return query; } },
    $transaction: async (queries) => Promise.all(queries),
  };
  const service = new AuthService(db, {}, {});

  await service.resetPassword(token, "new-correct-password");

  const sessionRevocation = updates.find((query) => query.where?.userId === buyerId && query.data?.revokedAt);
  assert.deepEqual(sessionRevocation.where, { userId: buyerId, revokedAt: null });
  assert.ok(sessionRevocation.data.revokedAt instanceof Date);
});
