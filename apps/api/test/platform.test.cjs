const test = require("node:test");
const assert = require("node:assert/strict");
const { StorageService } = require("../dist/platform/storage.service.js");
const { IdentityService } = require("../dist/platform/identity.service.js");
const { MessagingService } = require("../dist/platform/messaging.service.js");
const { ShippingService } = require("../dist/platform/shipping.service.js");

test("media upload rejects executable content before persistence", async () => {
  const service = new StorageService({});
  await assert.rejects(
    service.createUpload("00000000-0000-0000-0000-000000000001", {
      mimeType: "application/x-msdownload",
      sizeBytes: 100,
    }),
    (error) => error.getResponse().code === "UNSUPPORTED_MEDIA_TYPE",
  );
});

test("identity verification hashes the ID number before persistence", async () => {
  let persisted;
  const db = {
    identityVerification: {
      upsert: async (query) => {
        persisted = query.create;
        return query.create;
      },
    },
  };
  const service = new IdentityService(db, {});
  await service.submit("00000000-0000-0000-0000-000000000001", {
    fullName: "Demo User",
    idNumber: "012345678901",
  });
  assert.notEqual(persisted.submittedData.idNumberHash, "012345678901");
  assert.equal(JSON.stringify(persisted).includes("012345678901"), false);
});

test("non-participant cannot read a conversation", async () => {
  const db = {
    conversationParticipant: { findUnique: async () => null },
  };
  const service = new MessagingService(db, {});
  await assert.rejects(
    service.messages("00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"),
    (error) => error.getStatus() === 403,
  );
});

test("shipping webhook refuses an invalid signature", async () => {
  const previous = process.env.SHIPPING_WEBHOOK_SECRET;
  process.env.SHIPPING_WEBHOOK_SECRET = "test-secret";
  const service = new ShippingService({}, {});
  await assert.rejects(
    service.webhook("LOCAL", "bad", Buffer.from("{}"), {}),
    (error) => error.getResponse().code === "INVALID_SIGNATURE",
  );
  if (previous === undefined) delete process.env.SHIPPING_WEBHOOK_SECRET;
  else process.env.SHIPPING_WEBHOOK_SECRET = previous;
});
