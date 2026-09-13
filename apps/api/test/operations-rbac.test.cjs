const test = require("node:test");
const assert = require("node:assert/strict");
const { OperationsController } = require("../dist/operations/operations.controller.js");
const { OperationsService } = require("../dist/operations/operations.service.js");
const { ROLES_KEY } = require("../dist/auth/roles.decorator.js");
const { RolesGuard } = require("../dist/auth/roles.guard.js");

const actor = (role, id = "actor-1") => ({ id, roles: role ? [role] : [] });

function guardContext(request) {
  return {
    getHandler: () => "handler",
    getClass: () => "controller",
    switchToHttp: () => ({ getRequest: () => request }),
  };
}

test("RolesGuard authenticates protected routes, allows matching roles, and rejects unrelated roles", async () => {
  let requiredRoles;
  let authenticationCalls = 0;
  const reflector = { getAllAndOverride: () => requiredRoles };
  const auth = {
    canActivate: async (context) => {
      authenticationCalls += 1;
      context.switchToHttp().getRequest().user = actor("ADMIN");
      return true;
    },
  };
  const guard = new RolesGuard(reflector, auth);

  requiredRoles = undefined;
  assert.equal(await guard.canActivate(guardContext({})), true);
  assert.equal(authenticationCalls, 0);

  requiredRoles = ["ADMIN", "SUPER_ADMIN"];
  assert.equal(await guard.canActivate(guardContext({})), true);
  assert.equal(authenticationCalls, 1);

  const deniedGuard = new RolesGuard(reflector, {
    canActivate: async (context) => {
      context.switchToHttp().getRequest().user = actor("BUYER");
      return true;
    },
  });
  await assert.rejects(
    deniedGuard.canActivate(guardContext({})),
    (error) => error.getStatus() === 403 && error.getResponse().code === "FORBIDDEN",
  );
});

test("every privileged admin endpoint declares its exact role metadata", () => {
  const moderation = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
  const administration = ["ADMIN", "SUPER_ADMIN"];
  const expected = {
    adminDashboard: moderation,
    adminApplications: moderation,
    reviewSeller: moderation,
    adminProducts: moderation,
    reviewProduct: moderation,
    adminOrders: moderation,
    adminShops: moderation,
    sanctionWarn: moderation,
    sanctionSuspend: moderation,
    sanctionBan: moderation,
    sanctionRestore: moderation,
    adminReports: moderation,
    adminDisputes: moderation,
    resolveDispute: moderation,
    adminGames: moderation,
    adminApps: moderation,
    adminGameProducts: moderation,
    adminAppProducts: moderation,
    reviewGame: moderation,
    reviewApp: moderation,
    resolveReport: moderation,
    adminGame: administration,
    adminApp: administration,
    adminUsers: administration,
    adminUser: administration,
    banUser: administration,
    unbanUser: administration,
    note: administration,
    schemas: administration,
    saveSchema: administration,
    conversations: administration,
    reply: administration,
    conversationStatus: administration,
    conversationAutomation: administration,
    legacyUpdateUser: administration,
    createApplication: administration,
    updateApplication: administration,
    deleteApplication: administration,
    resetApplications: administration,
    deleteUser: ["SUPER_ADMIN"],
    adjustBalance: ["SUPER_ADMIN", "FINANCE_ADMIN"],
  };

  for (const [method, roles] of Object.entries(expected))
    assert.deepEqual(Reflect.getMetadata(ROLES_KEY, OperationsController.prototype[method]), roles, method);
});

test("admin approval happy path promotes seller and creates one owned shop atomically", async () => {
  const writes = [];
  const application = { id: "application-1", applicantId: "seller-1", legalName: "Cửa Hàng Việt" };
  const tx = {
    sellerApplication: {
      update: async (query) => { writes.push(["application", query]); return { ...application, status: "APPROVED" }; },
    },
    role: {
      upsert: async (query) => { writes.push(["role", query]); return { id: "seller-owner-role" }; },
    },
    userRole: { upsert: async (query) => writes.push(["userRole", query]) },
    shop: {
      findUnique: async () => null,
      create: async (query) => { writes.push(["shop", query]); return { id: "shop-1" }; },
    },
    shopMember: { create: async (query) => writes.push(["shopMember", query]) },
  };
  const service = new OperationsService({
    sellerApplication: { findUnique: async ({ where }) => where.id === application.id ? application : null },
    $transaction: async (callback) => callback(tx),
  });

  const result = await service.reviewSeller(actor("MODERATOR"), application.id, { action: "APPROVE" });

  assert.equal(result.status, "APPROVED");
  assert.equal(writes.find(([name]) => name === "application")[1].data.status, "APPROVED");
  assert.equal(writes.find(([name]) => name === "role")[1].where.key, "SELLER_OWNER");
  assert.deepEqual(writes.find(([name]) => name === "userRole")[1].create, {
    userId: "seller-1",
    roleId: "seller-owner-role",
  });
  const shop = writes.find(([name]) => name === "shop")[1].data;
  assert.equal(shop.status, "ACTIVE");
  assert.match(shop.slug, /^cua-hang-viet-[a-f0-9]{6}$/);
  assert.deepEqual(writes.find(([name]) => name === "shopMember")[1].data, {
    shopId: "shop-1",
    userId: "seller-1",
    role: "OWNER",
  });
});

test("product moderation happy path publishes an approved product", async () => {
  let update;
  let outbox;
  const tx = {
    product: { update: async (query) => { update = query; return { id: query.where.id, ...query.data }; } },
    outboxEvent: { create: async (query) => { outbox = query; } },
  };
  const service = new OperationsService({ $transaction: async (callback) => callback(tx) });

  const result = await service.reviewProduct(actor("MODERATOR", "moderator-1"), "product-1", { action: "APPROVE" });
  assert.equal(result.status, "ACTIVE");
  assert.equal(update.data.reviewedBy, "moderator-1");
  assert.ok(update.data.reviewedAt instanceof Date);
  assert.ok(update.data.publishedAt instanceof Date);
  assert.deepEqual(outbox.data.payload, { productId: "product-1" });
  assert.equal(outbox.data.eventType, "PRODUCT_INDEX_SYNC");
});

test("product creation and search outbox event commit atomically then invalidate catalog cache", async () => {
  let outbox;
  let invalidations = 0;
  const tx = {
    product: { create: async (query) => ({ id: "product-created", ...query.data, variants: [], appPlans: [] }) },
    outboxEvent: { create: async (query) => { outbox = query; } },
  };
  const service = new OperationsService(
    { $transaction: async (callback) => callback(tx) },
    { invalidate: async () => { invalidations += 1; } },
  );
  service.sellerShop = async () => ({ id: "shop-1" });

  const product = await service.createProduct("seller-1", {
    type: "PHYSICAL", name: "Bàn phím", price: 500000, stock: 3,
  });

  assert.equal(product.id, "product-created");
  assert.equal(outbox.data.eventType, "PRODUCT_INDEX_SYNC");
  assert.deepEqual(outbox.data.payload, { productId: "product-created" });
  assert.equal(invalidations, 1);
});

test("admin endpoint happy paths return safe data and write finance audit records", async () => {
  const auditWrites = [];
  const db = {
    order: { count: async () => 9, aggregate: async () => ({ _sum: { totalAmount: 2500n } }) },
    user: {
      count: async () => 7,
      findMany: async () => [{
        id: "user-1", fullName: "Buyer", emailNormalized: "buyer@example.test",
        phoneNormalized: "0900", status: "ACTIVE", createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }],
      update: async (query) => ({ id: query.where.id, status: query.data.status }),
    },
    shop: { count: async () => 3 },
    sellerApplication: { count: async () => 2 },
    product: { count: async () => 4 },
    wallet: { upsert: async (query) => { auditWrites.push(["wallet", query]); return { availableAmount: 1500n }; } },
    auditLog: { create: async (query) => auditWrites.push(["audit", query]) },
  };
  const operations = new OperationsService(db);
  const controller = new OperationsController(operations, {}, {}, {});

  const dashboard = await controller.adminDashboard({ user: actor("MODERATOR") });
  assert.deepEqual(dashboard, {
    gmv: 2500, revenue: 0, totalOrders: 9, activeUsers: 7, activeShops: 3,
    pendingSellersCount: 2, pendingProductsCount: 4,
  });

  const users = await controller.adminUsers({ user: actor("ADMIN") }, { status: "ACTIVE", query: "buyer" });
  assert.deepEqual(users[0], {
    id: "user-1", fullName: "Buyer", email: "buyer@example.test", phoneNumber: "0900",
    status: "ACTIVE", walletBalance: 0, createdAt: "2026-01-01T00:00:00.000Z",
  });
  assert.equal("password" in users[0], false);

  assert.deepEqual(await controller.deleteUser({ user: actor("SUPER_ADMIN") }, "user-1"), { id: "user-1", status: "DELETED" });

  const balance = await controller.adjustBalance(
    { user: actor("FINANCE_ADMIN", "finance-1"), requestId: "request-1" },
    "user-1",
    { amount: 500, reason: "correction" },
  );
  assert.deepEqual(balance, { newBalance: 1500 });
  assert.equal(auditWrites.find(([name]) => name === "wallet")[1].update.availableAmount.increment, 500n);
  assert.deepEqual(auditWrites.find(([name]) => name === "audit")[1].data, {
    actorUserId: "finance-1",
    action: "WALLET_ADJUST",
    targetType: "USER",
    targetId: "user-1",
    reason: "correction",
    requestId: "request-1",
    metadata: { amount: "500" },
  });
});
