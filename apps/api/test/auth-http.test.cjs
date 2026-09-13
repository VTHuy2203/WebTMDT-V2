const test = require("node:test");
const assert = require("node:assert/strict");
const { AuthController } = require("../dist/auth/auth.controller.js");
const { AuthGuard } = require("../dist/auth/auth.guard.js");

function responseSpy() {
  const cookies = [];
  const cleared = [];
  return {
    cookies,
    cleared,
    cookie: (...args) => cookies.push(args),
    clearCookie: (...args) => cleared.push(args),
  };
}

test("AuthController delegates account operations and keeps refresh tokens in scoped cookies", async () => {
  const calls = [];
  const auth = {
    register: async (body) => ({ accessToken: "access-register", refreshToken: "refresh-register", user: body }),
    login: async (body) => ({ accessToken: "access-login", refreshToken: "refresh-login", user: body }),
    refresh: async (token) => ({ accessToken: "access-refresh", refreshToken: `${token}-rotated` }),
    logout: async (sessionId) => calls.push(["logout", sessionId]),
    me: (id) => ["me", id],
    requestPasswordReset: (email) => ["forgot", email],
    resetPassword: (token, password) => ["reset", token, password],
    requestEmailVerification: (id) => ["request-verification", id],
    verifyEmail: (token) => ["verify-email", token],
  };
  const controller = new AuthController(auth);
  const previousNodeEnv = process.env.NODE_ENV;
  const previousTtl = process.env.REFRESH_TOKEN_TTL_DAYS;
  process.env.NODE_ENV = "production";
  process.env.REFRESH_TOKEN_TTL_DAYS = "7";
  try {
    const registerResponse = responseSpy();
    assert.deepEqual(
      await controller.register({ headers: { "x-client-app": "SELLER" } }, { name: "New user" }, registerResponse),
      { accessToken: "access-register", user: { name: "New user" } },
    );
    assert.deepEqual(registerResponse.cookies[0], [
      "marketplace_refresh_seller",
      "refresh-register",
      { httpOnly: true, secure: true, sameSite: "lax", path: "/api/v1/auth", maxAge: 7 * 86400000 },
    ]);

    const loginResponse = responseSpy();
    assert.deepEqual(
      await controller.login({ headers: { "x-client-app": "unknown" } }, { email: "buyer@example.test" }, loginResponse),
      { accessToken: "access-login", user: { email: "buyer@example.test" } },
    );
    assert.equal(loginResponse.cookies[0][0], "marketplace_refresh_buyer");

    const refreshResponse = responseSpy();
    assert.deepEqual(
      await controller.refresh(
        { headers: { "x-client-app": "admin" }, cookies: { marketplace_refresh_admin: "old-refresh" } },
        refreshResponse,
      ),
      { accessToken: "access-refresh" },
    );
    assert.equal(refreshResponse.cookies[0][0], "marketplace_refresh_admin");
    assert.equal(refreshResponse.cookies[0][1], "old-refresh-rotated");

    const logoutResponse = responseSpy();
    await controller.logout({ headers: {}, user: { sessionId: "session-1" } }, logoutResponse);
    assert.deepEqual(calls, [["logout", "session-1"]]);
    assert.deepEqual(logoutResponse.cleared.map(([name]) => name), [
      "marketplace_refresh_buyer",
      "marketplace_refresh",
    ]);

    assert.deepEqual(controller.me({ user: { id: "user-1" } }), ["me", "user-1"]);
    assert.deepEqual(controller.forgot("buyer@example.test"), ["forgot", "buyer@example.test"]);
    assert.deepEqual(controller.reset({ token: "reset-token", password: "new-password" }), ["reset", "reset-token", "new-password"]);
    assert.deepEqual(controller.requestVerification({ user: { id: "user-1" } }), ["request-verification", "user-1"]);
    assert.deepEqual(controller.verifyEmail("verify-token"), ["verify-email", "verify-token"]);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousTtl === undefined) delete process.env.REFRESH_TOKEN_TTL_DAYS;
    else process.env.REFRESH_TOKEN_TTL_DAYS = previousTtl;
  }
});

function contextFor(request) {
  return { switchToHttp: () => ({ getRequest: () => request }) };
}

test("AuthGuard accepts a live session and populates the authenticated user", async () => {
  const request = { headers: { authorization: "bearer valid-token" } };
  let verificationCalls = 0;
  const guard = new AuthGuard(
    { verifyAsync: async (token) => {
      verificationCalls += 1;
      assert.equal(token, "valid-token");
      return { sub: "user-1", sid: "session-1", roles: ["BUYER"] };
    } },
    { session: { findUnique: async () => ({ expiresAt: new Date(Date.now() + 60_000), revokedAt: null }) } },
  );

  assert.equal(await guard.canActivate(contextFor(request)), true);
  assert.equal(await guard.canActivate(contextFor(request)), true);
  assert.equal(verificationCalls, 1);
  assert.deepEqual(request.user, { id: "user-1", roles: ["BUYER"], sessionId: "session-1" });
});

test("AuthGuard defaults missing roles and rejects absent, invalid, revoked, and expired sessions", async () => {
  const missingToken = new AuthGuard({}, {});
  await assert.rejects(
    missingToken.canActivate(contextFor({ headers: {} })),
    (error) => error.getResponse().message === "Bạn cần đăng nhập",
  );

  const validWithoutRoles = { headers: { authorization: "Bearer token" } };
  const defaultRolesGuard = new AuthGuard(
    { verifyAsync: async () => ({ sub: "user-2", sid: "session-2" }) },
    { session: { findUnique: async () => ({ expiresAt: new Date(Date.now() + 60_000), revokedAt: null }) } },
  );
  await defaultRolesGuard.canActivate(contextFor(validWithoutRoles));
  assert.deepEqual(validWithoutRoles.user.roles, []);

  for (const scenario of [
    { jwt: { verifyAsync: async () => { throw new Error("bad token"); } }, session: null },
    { jwt: { verifyAsync: async () => ({ sid: "missing" }) }, session: null },
    { jwt: { verifyAsync: async () => ({ sid: "revoked" }) }, session: { revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) } },
    { jwt: { verifyAsync: async () => ({ sid: "expired" }) }, session: { revokedAt: null, expiresAt: new Date(Date.now() - 60_000) } },
  ]) {
    const guard = new AuthGuard(scenario.jwt, { session: { findUnique: async () => scenario.session } });
    await assert.rejects(
      guard.canActivate(contextFor({ headers: { authorization: "Bearer token" } })),
      (error) => error.getResponse().message === "Phiên đăng nhập không hợp lệ",
    );
  }
});
