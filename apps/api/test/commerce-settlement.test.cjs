const test = require("node:test");
const assert = require("node:assert/strict");
const { CommerceService } = require("../dist/commerce/commerce.service.js");

const buyerId = "00000000-0000-0000-0000-000000000001";
const shopId = "00000000-0000-0000-0000-000000000004";

function settlementTransaction(state, callbacks) {
  return async (callback) => {
    const draft = {
      ...state,
      wallet: { ...state.wallet },
      ledgerTransactions: [...state.ledgerTransactions],
      deliveredAt: state.deliveredAt,
    };
    const tx = {
      order: {
        update: async () => { draft.orderStatus = "COMPLETED"; },
        updateMany: async () => {
          if (!["PAID", "PROCESSING"].includes(draft.orderStatus)) return { count: 0 };
          draft.orderStatus = "COMPLETED";
          return { count: 1 };
        },
      },
      digitalDelivery: {
        updateMany: async ({ data }) => { draft.deliveredAt = data.deliveredAt; },
      },
      $executeRaw: async (_strings, ...values) => {
        const amount = values[0];
        if (draft.wallet.pendingAmount < amount) return 0;
        draft.wallet.pendingAmount -= amount;
        draft.wallet.availableAmount += amount;
        draft.wallet.version += 1;
        return 1;
      },
      ledgerTransaction: {
        create: async ({ data }) => { draft.ledgerTransactions.push(data); },
      },
    };
    try {
      const result = await callback(tx);
      Object.assign(state, draft);
      callbacks?.onCommit?.();
      return result;
    } catch (error) {
      callbacks?.onRollback?.();
      throw error;
    }
  };
}

function assertPostedDoubleEntry(ledger, order) {
  assert.equal(ledger.referenceType, "ORDER_SETTLEMENT");
  assert.equal(ledger.referenceId, order.id);
  assert.equal(ledger.idempotencyKey, `settlement:${order.id}`);
  assert.equal(ledger.status, "POSTED");
  assert.ok(ledger.postedAt instanceof Date);
  assert.deepEqual(ledger.entries.create, [
    { accountCode: `SELLER_PENDING:${shopId}`, direction: "DEBIT", amount: order.totalAmount },
    { accountCode: `SELLER_AVAILABLE:${shopId}`, direction: "CREDIT", amount: order.totalAmount },
  ]);
  const debit = ledger.entries.create
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + entry.amount, 0n);
  const credit = ledger.entries.create
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((sum, entry) => sum + entry.amount, 0n);
  assert.equal(debit, credit);
  assert.equal(debit, order.totalAmount);
}

test("confirmReceived atomically settles seller pending wallet balance and posts balanced ledger entries", async () => {
  const order = { id: "order-physical", shopId, code: "OD-PHYSICAL", totalAmount: 125_000n, status: "DELIVERED" };
  const state = {
    orderStatus: order.status,
    wallet: { pendingAmount: 125_000n, availableAmount: 75_000n, version: 3 },
    ledgerTransactions: [],
  };
  const db = {
    order: { findFirst: async () => order },
    $transaction: settlementTransaction(state),
  };
  const service = new CommerceService(db);
  service.order = async () => ({ id: order.id, status: state.orderStatus });

  const response = await service.confirmReceived(buyerId, order.id);

  assert.deepEqual(response, { id: order.id, status: "COMPLETED" });
  assert.equal(state.orderStatus, "COMPLETED");
  assert.deepEqual(state.wallet, { pendingAmount: 0n, availableAmount: 200_000n, version: 4 });
  assert.equal(state.ledgerTransactions.length, 1);
  assertPostedDoubleEntry(state.ledgerTransactions[0], order);
});

test("confirmReceived rolls back order completion and ledger posting when pending wallet balance is insufficient", async () => {
  const order = { id: "order-insufficient", shopId, code: "OD-INSUFFICIENT", totalAmount: 125_000n, status: "DELIVERED" };
  const state = {
    orderStatus: order.status,
    wallet: { pendingAmount: 124_999n, availableAmount: 75_000n, version: 3 },
    ledgerTransactions: [],
  };
  const db = {
    order: { findFirst: async () => order },
    $transaction: settlementTransaction(state),
  };
  const service = new CommerceService(db);

  await assert.rejects(
    service.confirmReceived(buyerId, order.id),
    (error) => error.getResponse().code === "WALLET_BALANCE_INVALID",
  );

  assert.equal(state.orderStatus, "DELIVERED");
  assert.deepEqual(state.wallet, { pendingAmount: 124_999n, availableAmount: 75_000n, version: 3 });
  assert.deepEqual(state.ledgerTransactions, []);
});

test("confirmDigitalReceived settles only after revealed delivery and marks delivery completion with a balanced ledger", async () => {
  const order = {
    id: "order-digital",
    shopId,
    code: "OD-DIGITAL",
    totalAmount: 80_000n,
    status: "PAID",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    items: [{ deliveries: [{ id: "delivery-1", status: "REVEALED" }] }],
  };
  const state = {
    orderStatus: order.status,
    wallet: { pendingAmount: 80_000n, availableAmount: 20_000n, version: 7 },
    ledgerTransactions: [],
    deliveredAt: undefined,
  };
  const db = {
    order: { findFirst: async () => order },
    $transaction: settlementTransaction(state),
  };
  const service = new CommerceService(db);

  const response = await service.confirmDigitalReceived(buyerId, order.id);

  assert.equal(response.success, true);
  assert.ok(Number.isFinite(Date.parse(response.completedAt)));
  assert.equal(state.orderStatus, "COMPLETED");
  assert.ok(state.deliveredAt instanceof Date);
  assert.deepEqual(state.wallet, { pendingAmount: 0n, availableAmount: 100_000n, version: 8 });
  assert.equal(state.ledgerTransactions.length, 1);
  assertPostedDoubleEntry(state.ledgerTransactions[0], order);
});
