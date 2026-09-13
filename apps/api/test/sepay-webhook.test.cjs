const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceController } = require("../dist/commerce/commerce.controller.js");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const paymentCode = "MPABCDEF123456";

function withWebhookSecret(fn) {
  return async () => {
    const previous = process.env.SEPAY_WEBHOOK_SECRET;
    process.env.SEPAY_WEBHOOK_SECRET = "test-webhook-secret";
    try {
      await fn();
    } finally {
      if (previous === undefined) delete process.env.SEPAY_WEBHOOK_SECRET;
      else process.env.SEPAY_WEBHOOK_SECRET = previous;
    }
  };
}

test("SePay webhook rejects an invalid bearer credential before any payment lookup", withWebhookSecret(async () => {
  let lookedUp = false;
  const controller = new CommerceController({
    processWebhook: async () => { lookedUp = true; },
  });

  await assert.rejects(
    controller.sepay("Bearer forged-secret", { content: paymentCode, id: "bank-tx-1", transferAmount: 100_000 }),
    (error) => error.getResponse().code === "INVALID_WEBHOOK_AUTH",
  );
  assert.equal(lookedUp, false);
}));

test("valid SePay webhook with matching payment code and amount confirms payment exactly once", withWebhookSecret(async () => {
  const intent = {
    id: "payment-1",
    paymentCode,
    amount: 100_000n,
    expiresAt: new Date(Date.now() + 60_000),
  };
  let confirmation;
  const service = new CommerceService({
    paymentIntent: { findUnique: async ({ where }) => where.paymentCode === paymentCode ? intent : null },
  });
  service.confirmPayment = async (id, externalId) => {
    confirmation = { id, externalId };
    return { ...intent, status: "PAID" };
  };
  const controller = new CommerceController(service);

  const result = await controller.sepay("Bearer test-webhook-secret", {
    content: `Thanh toan ${paymentCode}`,
    id: "bank-tx-100",
    transferAmount: 100_000,
  });

  assert.deepEqual(result, { accepted: true, matched: true, status: "PAID" });
  assert.deepEqual(confirmation, { id: intent.id, externalId: "bank-tx-100" });
}));

test("SePay webhook with a mismatched amount never confirms payment and opens reconciliation", withWebhookSecret(async () => {
  const intent = {
    id: "payment-2",
    paymentCode,
    amount: 100_000n,
    expiresAt: new Date(Date.now() + 60_000),
  };
  const state = { intentStatus: "PENDING", confirmationCalls: 0, transaction: undefined, reconciliation: undefined };
  const service = new CommerceService({
    paymentIntent: {
      findUnique: async () => intent,
      update: async ({ data }) => { state.intentStatus = data.status; },
    },
    paymentTransaction: {
      upsert: async ({ create }) => {
        state.transaction = { id: "transaction-2", ...create };
        return state.transaction;
      },
    },
    paymentReconciliation: {
      upsert: async ({ create }) => { state.reconciliation = create; },
    },
  });
  service.confirmPayment = async () => { state.confirmationCalls += 1; };
  const controller = new CommerceController(service);

  const result = await controller.sepay("Bearer test-webhook-secret", {
    description: paymentCode,
    transactionId: "bank-tx-101",
    amount: 99_999,
  });

  assert.deepEqual(result, { accepted: true, matched: true, status: "REVIEW_REQUIRED" });
  assert.equal(state.confirmationCalls, 0);
  assert.equal(state.intentStatus, "REVIEW_REQUIRED");
  assert.equal(state.transaction.amount, 99_999n);
  assert.equal(state.reconciliation.paymentIntentId, intent.id);
  assert.equal(state.reconciliation.reasonCode, "AMOUNT_MISMATCH");
}));

test("SePay webhook with an unknown payment code leaves every payment state unchanged", withWebhookSecret(async () => {
  let confirmationCalls = 0;
  const service = new CommerceService({
    paymentIntent: { findUnique: async () => null },
  });
  service.confirmPayment = async () => { confirmationCalls += 1; };
  const controller = new CommerceController(service);

  const result = await controller.sepay("Bearer test-webhook-secret", {
    content: "MPZZZZZZ999999",
    referenceCode: "bank-tx-102",
    transferAmount: 100_000,
  });

  assert.deepEqual(result, { accepted: true, matched: false });
  assert.equal(confirmationCalls, 0);
}));
