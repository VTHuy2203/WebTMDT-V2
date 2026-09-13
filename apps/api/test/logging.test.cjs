const test = require("node:test");
const assert = require("node:assert/strict");
const { throwError } = require("rxjs");
const {
  getRequestId,
  correlationIdMiddleware,
  normalizeRequestId,
} = require("../dist/common/request-context.js");
const {
  pseudonymizeIdentifier,
  redactLogValue,
  safeRequestPath,
  writeStructuredLog,
} = require("../dist/common/structured-logger.js");
const {
  RequestLoggingInterceptor,
} = require("../dist/common/request-logging.interceptor.js");

function captureStdout(run) {
  const lines = [];
  const original = process.stdout.write;
  process.stdout.write = (chunk) => {
    lines.push(String(chunk));
    return true;
  };
  return Promise.resolve()
    .then(run)
    .then(() => lines)
    .finally(() => { process.stdout.write = original; });
}

test("structured logger redacts nested secrets and PII without logging query values", async () => {
  const output = await captureStdout(() => {
    writeStructuredLog("info", "redaction_check", {
      path: safeRequestPath("/api/v1/orders?email=buyer@example.com&token=raw-token"),
      authorization: "Bearer raw-access-token",
      nested: {
        password: "raw-password",
        email: "buyer@example.com",
        note: "contact buyer@example.com or 0912345678 with Bearer raw-token",
      },
    });
  });
  const record = JSON.parse(output[0]);

  assert.equal(record.path, "/api/v1/orders");
  assert.equal(record.authorization, "[REDACTED]");
  assert.equal(record.nested.password, "[REDACTED]");
  assert.equal(record.nested.email, "[REDACTED]");
  assert.doesNotMatch(output[0], /buyer@example\.com|0912345678|raw-token|raw-password/);
  assert.equal(redactLogValue({ api_key: "secret" }).api_key, "[REDACTED]");
});

test("correlation middleware preserves safe IDs, rejects unsafe IDs, and exposes context", () => {
  const headers = {};
  const request = { headers: { "x-request-id": "client-request-123" } };
  correlationIdMiddleware(
    request,
    { setHeader: (name, value) => { headers[name] = value; } },
    () => assert.equal(getRequestId(), "client-request-123"),
  );
  assert.equal(request.requestId, "client-request-123");
  assert.equal(headers["X-Request-ID"], "client-request-123");

  const generated = normalizeRequestId("bad id\nforged-header");
  assert.match(generated, /^req_[0-9a-f-]{36}$/);
});

test("request interceptor emits a correlated, redacted 5xx event with an error stack", async () => {
  process.env.LOG_HASH_SALT = "test-log-salt";
  const request = {
    method: "GET",
    originalUrl: "/api/v1/orders?token=must-not-leak&email=buyer@example.com",
    requestId: "request-error-123",
    user: { id: "user-private-id" },
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ statusCode: 200 }),
    }),
  };
  const interceptor = new RequestLoggingInterceptor();
  const output = await captureStdout(
    () =>
      new Promise((resolve) => {
        interceptor
          .intercept(context, {
            handle: () => throwError(() => new Error("failure for buyer@example.com")),
          })
          .subscribe({ error: () => resolve() });
      }),
  );
  const record = JSON.parse(output[0]);

  assert.equal(record.level, "error");
  assert.equal(record.event, "http_request");
  assert.equal(record.statusCode, 500);
  assert.equal(record.path, "/api/v1/orders");
  assert.equal(record.requestId, "request-error-123");
  assert.equal(record.actorIdHash, pseudonymizeIdentifier("user-private-id"));
  assert.match(record.error.stack, /logging\.test\.cjs/);
  assert.doesNotMatch(output[0], /must-not-leak|buyer@example\.com|user-private-id/);
});
