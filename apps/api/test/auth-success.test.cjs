const test = require("node:test");
const assert = require("node:assert/strict");
const { hash, verify } = require("argon2");
const { AuthService } = require("../dist/auth/auth.service.js");

const userId = "00000000-0000-0000-0000-000000000001";

function jwtStub() {
  const calls = [];
  return {
    calls,
    signAsync: async (payload, options) => {
      calls.push({ payload, options });
      return `signed-${calls.length}`;
    },
  };
}

test("register creates a BUYER account with a hashed password and an authenticated session", async () => {
  const created = {};
  const sessions = [];
  const jwt = jwtStub();
  const db = {
    user: {
      findFirst: async () => null,
      create: async ({ data, include }) => {
        created.data = data;
        assert.deepEqual(include, { roles: { include: { role: true } } });
        return {
          id: userId,
          fullName: data.fullName,
          emailNormalized: data.emailNormalized,
          phoneNormalized: data.phoneNormalized,
          passwordHash: data.passwordHash,
          status: "ACTIVE",
          roles: [{ role: { key: "BUYER" } }],
        };
      },
    },
    role: { upsert: async () => ({ id: "buyer-role" }) },
    session: { upsert: async (query) => { sessions.push(query); } },
  };
  const service = new AuthService(db, jwt, {});

  const result = await service.register({
    fullName: "Buyer One",
    email: "BUYER@EXAMPLE.TEST",
    phoneNumber: "0901234567",
    password: "correct-password",
  });

  assert.equal(created.data.emailNormalized, "buyer@example.test");
  assert.equal(created.data.phoneNormalized, "0901234567");
  assert.equal(await verify(created.data.passwordHash, "correct-password"), true);
  assert.equal(result.accessToken, "signed-1");
  assert.equal(result.refreshToken, "signed-2");
  assert.equal(result.user.id, userId);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].create.userId, userId);
  assert.equal(await verify(sessions[0].create.refreshTokenHash, result.refreshToken), true);
  assert.deepEqual(jwt.calls[0].payload.roles, ["BUYER"]);
});

test("successful login clears failed-login state and issues fresh tokens", async () => {
  const user = {
    id: userId,
    fullName: "Buyer One",
    emailNormalized: "buyer@example.test",
    phoneNormalized: "0901234567",
    passwordHash: await hash("correct-password"),
    status: "ACTIVE",
    failedLoginCount: 3,
    lockedUntil: new Date(Date.now() - 60_000),
    roles: [{ role: { key: "BUYER" } }],
  };
  const updates = [];
  const jwt = jwtStub();
  const db = {
    user: {
      findUnique: async ({ where }) => {
        assert.deepEqual(where, { emailNormalized: "buyer@example.test" });
        return user;
      },
      update: async (query) => { updates.push(query); },
    },
    session: { upsert: async () => {} },
  };
  const service = new AuthService(db, jwt, {});

  const result = await service.login({ email: "BUYER@EXAMPLE.TEST", password: "correct-password" });

  assert.deepEqual(updates, [{ where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: null } }]);
  assert.equal(result.accessToken, "signed-1");
  assert.equal(result.refreshToken, "signed-2");
  assert.equal(jwt.calls.length, 2);
});

test("logout revokes exactly the authenticated session", async () => {
  const calls = [];
  const service = new AuthService({
    session: { updateMany: async (query) => { calls.push(query); } },
  }, {}, {});

  await service.logout("session-1");

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].where, { id: "session-1" });
  assert.ok(calls[0].data.revokedAt instanceof Date);
});
