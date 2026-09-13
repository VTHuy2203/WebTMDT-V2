const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { AuthService } = require("../dist/auth/auth.service.js");

const userId = "00000000-0000-0000-0000-000000000001";
const resetToken = "reset-token-value-long-enough-123456";
const verifyToken = "verify-token-value-long-enough-123456";

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

test("password-reset request stores only a token hash and sends the raw token only through email", async () => {
  let persisted;
  let sent;
  const service = new AuthService({
    user: { findUnique: async () => ({ id: userId, emailNormalized: "buyer@example.test" }) },
    accountToken: { create: async ({ data }) => { persisted = data; } },
  }, {}, {
    sendAccountLink: async (...args) => { sent = args; },
  });

  const result = await service.requestPasswordReset("BUYER@EXAMPLE.TEST");

  assert.equal(result.accepted, true);
  assert.equal(persisted.userId, userId);
  assert.equal(persisted.type, "PASSWORD_RESET");
  assert.match(persisted.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(sent[0], "buyer@example.test");
  assert.equal(sent[2], "/reset-password");
  assert.equal(persisted.tokenHash, tokenHash(sent[3]));
  assert.notEqual(JSON.stringify(persisted), sent[3]);
});

test("password reset rejects an unknown or expired token without changing user, sessions, or token state", async () => {
  for (const record of [null, {
    id: "expired-reset", userId, type: "PASSWORD_RESET", consumedAt: null,
    expiresAt: new Date(Date.now() - 1_000),
  }]) {
    const writes = [];
    const service = new AuthService({
      accountToken: {
        findUnique: async ({ where }) => {
          assert.equal(where.tokenHash, tokenHash(resetToken));
          return record;
        },
        update: async (query) => writes.push(query),
      },
      user: { update: async (query) => writes.push(query) },
      session: { updateMany: async (query) => writes.push(query) },
      $transaction: async (queries) => Promise.all(queries),
    }, {}, {});

    await assert.rejects(
      service.resetPassword(resetToken, "new-correct-password"),
      (error) => error.getResponse().code === "INVALID_OR_EXPIRED_TOKEN",
    );
    assert.deepEqual(writes, []);
  }
});

test("a valid password reset consumes its hashed token and revokes every active session", async () => {
  const writes = [];
  const service = new AuthService({
    accountToken: {
      findUnique: async ({ where }) => {
        assert.equal(where.tokenHash, tokenHash(resetToken));
        return { id: "reset-1", userId, type: "PASSWORD_RESET", consumedAt: null, expiresAt: new Date(Date.now() + 60_000) };
      },
      update: async (query) => writes.push(query),
    },
    user: { update: async (query) => writes.push(query) },
    session: { updateMany: async (query) => writes.push(query) },
    $transaction: async (queries) => Promise.all(queries),
  }, {}, {});

  await service.resetPassword(resetToken, "new-correct-password");

  assert.equal(writes.length, 3);
  const consumed = writes.find((query) => query.where?.id === "reset-1");
  const sessions = writes.find((query) => query.where?.userId === userId);
  assert.ok(consumed.data.consumedAt instanceof Date);
  assert.deepEqual(sessions.where, { userId, revokedAt: null });
  assert.ok(sessions.data.revokedAt instanceof Date);
});

test("email verification rejects invalid/expired tokens and consumes a valid token exactly once", async () => {
  for (const record of [null, {
    id: "expired-verify", userId, type: "EMAIL_VERIFY", consumedAt: null,
    expiresAt: new Date(Date.now() - 1_000),
  }]) {
    const service = new AuthService({
      accountToken: { findUnique: async () => record },
      user: { update: async () => assert.fail("must not verify with invalid token") },
    }, {}, {});
    await assert.rejects(
      service.verifyEmail(verifyToken),
      (error) => error.getResponse().code === "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  const writes = [];
  const service = new AuthService({
    accountToken: {
      findUnique: async ({ where }) => {
        assert.equal(where.tokenHash, tokenHash(verifyToken));
        return { id: "verify-1", userId, type: "EMAIL_VERIFY", consumedAt: null, expiresAt: new Date(Date.now() + 60_000) };
      },
      update: async (query) => writes.push(query),
    },
    user: { update: async (query) => writes.push(query) },
    $transaction: async (queries) => Promise.all(queries),
  }, {}, {});
  assert.deepEqual(await service.verifyEmail(verifyToken), { verified: true });
  assert.equal(writes.length, 2);
  assert.equal(writes[0].where.id, userId);
  assert.ok(writes[0].data.emailVerifiedAt instanceof Date);
  assert.equal(writes[1].where.id, "verify-1");
  assert.ok(writes[1].data.consumedAt instanceof Date);
});
