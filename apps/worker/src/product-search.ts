import type { PrismaClient } from "@prisma/client";

const baseUrl = () => process.env.MEILISEARCH_URL?.replace(/\/$/, "");

function headers() {
  return {
    "content-type": "application/json",
    ...(process.env.MEILISEARCH_API_KEY ? { authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}` } : {}),
  };
}

async function request(path: string, init: RequestInit) {
  const url = baseUrl();
  if (!url) return undefined;
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(Number(process.env.SEARCH_TIMEOUT_MS ?? 5000)),
  });
  if (!response.ok && response.status !== 404)
    throw new Error(`Meilisearch ${path} returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response;
}

export function searchEnabled() {
  return Boolean(baseUrl());
}

export async function configureProductIndex() {
  if (!baseUrl()) return;
  const existing = await request("/indexes/products", { method: "GET" });
  if (existing?.status === 404)
    await request("/indexes", {
      method: "POST",
      body: JSON.stringify({ uid: "products", primaryKey: "id" }),
    });
  await request("/indexes/products/settings", {
    method: "PATCH",
    body: JSON.stringify({
      searchableAttributes: ["name", "description", "categoryName", "brandName", "shopName"],
      filterableAttributes: ["status", "type", "categorySlug", "brandSlug", "shopId", "minPriceAmount"],
      sortableAttributes: ["minPriceAmount", "createdAt", "publishedAt"],
      typoTolerance: { disableOnAttributes: ["id"] },
    }),
  });
}

export async function syncProduct(db: PrismaClient, productId: string) {
  if (!baseUrl()) return;
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { category: true, brand: true, shop: true },
  });
  if (!product || product.status !== "ACTIVE" || product.deletedAt) {
    await request(`/indexes/products/documents/${encodeURIComponent(productId)}`, { method: "DELETE" });
    return;
  }
  await request("/indexes/products/documents?primaryKey=id", {
    method: "POST",
    body: JSON.stringify([{
      id: product.id,
      name: product.name,
      description: product.description,
      status: product.status,
      type: product.type,
      categorySlug: product.category?.slug ?? null,
      categoryName: product.category?.name ?? null,
      brandSlug: product.brand?.slug ?? null,
      brandName: product.brand?.name ?? null,
      shopId: product.shopId,
      shopName: product.shop.name,
      minPriceAmount: Number(product.minPriceAmount ?? 0),
      createdAt: product.createdAt.toISOString(),
      publishedAt: product.publishedAt?.toISOString() ?? null,
    }]),
  });
}

export async function rebuildProductIndex(db: PrismaClient) {
  if (!baseUrl()) throw new Error("MEILISEARCH_URL is required");
  await configureProductIndex();
  const products = await db.product.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  for (const product of products) await syncProduct(db, product.id);
  return products.length;
}
