const test = require("node:test");
const assert = require("node:assert/strict");
const { ProductSearchService } = require("../dist/catalog/product-search.service.js");
const { ShippingService } = require("../dist/platform/shipping.service.js");
const { StorageService } = require("../dist/platform/storage.service.js");
const {
  CatalogController,
  CATALOG_RATE_LIMIT_MAX,
  CATALOG_RATE_LIMIT_WINDOW_MS,
} = require("../dist/catalog/catalog.controller.js");

test("catalog has a bounded high-throughput rate limit instead of disabling abuse protection", () => {
  assert.ok(CATALOG_RATE_LIMIT_MAX >= 500);
  assert.ok(CATALOG_RATE_LIMIT_WINDOW_MS <= 1000);
  assert.equal(
    Reflect.getMetadata("THROTTLER:LIMITdefault", CatalogController),
    CATALOG_RATE_LIMIT_MAX,
  );
  assert.equal(
    Reflect.getMetadata("THROTTLER:TTLdefault", CatalogController),
    CATALOG_RATE_LIMIT_WINDOW_MS,
  );
});

test("Meilisearch query sends structured filters and preserves ranked IDs", async () => {
  const originalFetch = global.fetch;
  process.env.MEILISEARCH_URL = "http://search.test";
  let request;
  global.fetch = async (url, init) => {
    request = { url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ hits: [{ id: "p2" }, { id: "p1" }], estimatedTotalHits: 2 }), { status: 200 });
  };
  try {
    const result = await new ProductSearchService().search({ query: "dien thoa", category: "phones", minPrice: 1000 }, "PHYSICAL");
    assert.deepEqual(result, { ids: ["p2", "p1"], total: 2 });
    assert.equal(request.url, "http://search.test/indexes/products/search");
    assert.ok(request.body.filter.includes('status = "ACTIVE"'));
    assert.ok(request.body.filter.includes('categorySlug = "phones"'));
  } finally {
    global.fetch = originalFetch;
    delete process.env.MEILISEARCH_URL;
  }
});

test("GHN quote uses parcel weight and rejects no carrier response as a fake local fee", async () => {
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    SHIPPING_PROVIDER: "GHN",
    GHN_TOKEN: "test-token",
    GHN_SHOP_ID: "123",
    GHN_FROM_DISTRICT_ID: "1442",
    GHN_API_URL: "https://dev-ghn.test",
  });
  let body;
  global.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({ code: 200, data: { total: 42500 } }), { status: 200 });
  };
  try {
    const service = new ShippingService({}, {});
    const result = await service.quote({
      destination: { districtId: 1452, wardCode: "21012" },
      items: [{ weightGrams: 750, quantity: 2 }],
      orderValue: 900000,
    });
    assert.equal(result.fee, 42500);
    assert.equal(body.weight, 1500);
    assert.equal(body.insurance_value, 900000);
  } finally {
    global.fetch = originalFetch;
    for (const key of ["SHIPPING_PROVIDER", "GHN_TOKEN", "GHN_SHOP_ID", "GHN_FROM_DISTRICT_ID", "GHN_API_URL"]) delete process.env[key];
  }
});

test("GHN quote resolves the website's named legacy address through carrier master data", async () => {
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    SHIPPING_PROVIDER: "GHN", GHN_TOKEN: "test-token", GHN_SHOP_ID: "123",
    GHN_FROM_DISTRICT_ID: "1442", GHN_API_URL: "https://dev-ghn.test",
  });
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    const data = url.endsWith("/province")
      ? [{ ProvinceID: 202, ProvinceName: "Hồ Chí Minh", NameExtension: ["TP. Hồ Chí Minh"] }]
      : url.endsWith("/district")
        ? [{ DistrictID: 1452, DistrictName: "Quận 1" }]
        : url.endsWith("/ward")
          ? [{ WardCode: "21012", WardName: "Phường Bến Nghé" }]
          : null;
    return new Response(JSON.stringify(data
      ? { code: 200, data }
      : { code: 200, data: { total: 31000 } }), { status: 200 });
  };
  try {
    const result = await new ShippingService({}, {}).quote({
      destination: { province: "TP. Hồ Chí Minh", district: "Quận 1", ward: "Phường Bến Nghé" },
      items: [{ weightGrams: 500, quantity: 1 }], orderValue: 100000,
    });
    assert.equal(result.fee, 31000);
    assert.equal(calls.length, 4);
  } finally {
    global.fetch = originalFetch;
    for (const key of ["SHIPPING_PROVIDER", "GHN_TOKEN", "GHN_SHOP_ID", "GHN_FROM_DISTRICT_ID", "GHN_API_URL"]) delete process.env[key];
  }
});

test("public media stores an immutable CDN URL while private media stays on authenticated API", async () => {
  process.env.CDN_PUBLIC_BASE_URL = "https://cdn.example.test";
  let updated;
  const db = {
    mediaObject: {
      findFirst: async ({ where }) => ({ id: where.id, ownerId: where.ownerId, bucket: "media", objectKey: "owner/image.webp", purpose: "PRODUCT", sizeBytes: 10 }),
      update: async ({ data }) => { updated = data; return data; },
    },
  };
  const service = new StorageService(db);
  service.client = { send: async () => ({ ContentLength: 10 }) };
  try {
    await service.complete("owner", "media-1");
    assert.equal(updated.publicUrl, "https://cdn.example.test/owner/image.webp");
  } finally {
    delete process.env.CDN_PUBLIC_BASE_URL;
  }
});
