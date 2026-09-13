const test = require("node:test");
const assert = require("node:assert/strict");
const { BadRequestException } = require("@nestjs/common");
const Sentry = require("@sentry/nestjs");
const { ApiExceptionFilter } = require("../dist/common/api-exception.filter.js");

function hostFor(response, request) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };
}

test("API exception filter sends unexpected 5xx errors to Sentry but ignores expected 4xx errors", async () => {
  const envelopes = [];
  Sentry.init({
    dsn: "http://public@127.0.0.1:4310/1",
    defaultIntegrations: false,
    transport: () => ({
      send: async (envelope) => { envelopes.push(envelope); return {}; },
      flush: async () => true,
    }),
  });
  const responses = [];
  const response = {
    status(code) { this.statusCode = code; return this; },
    json(body) { responses.push({ status: this.statusCode, body }); return this; },
  };
  const host = hostFor(response, {
    method: "GET",
    originalUrl: "/api/v1/verification",
    requestId: "request-verification-1",
    headers: { authorization: "Bearer must-not-be-sent" },
    body: { password: "must-not-be-sent" },
  });
  const filter = new ApiExceptionFilter();

  filter.catch(new Error("simulated api failure"), host);
  await Sentry.flush(1000);
  assert.equal(envelopes.length, 1);
  const sent = JSON.stringify(envelopes[0]);
  assert.match(sent, /simulated api failure/);
  assert.match(sent, /request-verification-1/);
  assert.doesNotMatch(sent, /must-not-be-sent/);
  assert.equal(responses[0].status, 500);

  filter.catch(new BadRequestException("expected validation failure"), host);
  await Sentry.flush(1000);
  assert.equal(envelopes.length, 1);
  assert.equal(responses[1].status, 400);
  await Sentry.close(1000);
});
