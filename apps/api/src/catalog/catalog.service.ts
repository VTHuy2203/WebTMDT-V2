import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CatalogCacheService } from "./catalog-cache.service";
import { ProductSearchService } from "./product-search.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly db: PrismaService,
    @Optional() private readonly cache?: CatalogCacheService,
    @Optional() private readonly productSearch?: ProductSearchService,
  ) {}

  private cached<T>(scope: string, input: unknown, ttl: number, load: () => Promise<T>) {
    return this.cache?.getOrSet(scope, input, ttl, load) ?? load();
  }

  private productDto(p: any) {
    const attrs = (
      p.attributes && typeof p.attributes === "object" ? p.attributes : {}
    ) as any;
    const document = attrs._document ?? {};
    const rawImages = document.images ?? attrs.images ?? [];
    const images = rawImages.map((image: any, index: number) =>
      typeof image === "string"
        ? { id: `${p.id}-${index}`, url: image, isThumbnail: index === 0, displayOrder: index }
        : {
            id: image.id ?? `${p.id}-${index}`,
            url: image.url ?? "",
            isThumbnail: image.isThumbnail ?? index === 0,
            displayOrder: image.displayOrder ?? index,
          },
    );
    const variants = (p.variants ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: Number(v.priceAmount),
      originalPrice:
        v.compareAtAmount == null ? undefined : Number(v.compareAtAmount),
      stock: Math.max(0, v.stockOnHand - v.stockReserved),
      options: v.attributes ?? {},
      attributes: v.attributes ?? {},
      availability: v.stockOnHand - v.stockReserved > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      compareAtPrice:
        v.compareAtAmount == null ? undefined : Number(v.compareAtAmount),
    }));
    const plans = (p.appPlans ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: Number(v.priceAmount),
      compareAtPrice:
        v.compareAtAmount == null ? undefined : Number(v.compareAtAmount),
      fulfillmentType: v.fulfillmentType,
      serviceDuration: {
        value: v.serviceDurationValue,
        unit: v.serviceDurationUnit,
      },
      warrantyDuration: {
        value: v.warrantyDurationValue,
        unit: v.warrantyDurationUnit,
      },
      deliveryEstimateMinutes: v.deliveryEstimateMinutes,
      purchaseLimit: v.purchaseLimit,
      buyerFieldDefinitions: v.buyerFieldSchema,
      status: v.status,
    }));
    return {
      ...document,
      id: p.id,
      shopId: p.shopId,
      slug: p.slug,
      name: p.name,
      title: p.name,
      description: p.description,
      type: p.type,
      status: p.status,
      price: Number(p.minPriceAmount ?? 0),
      basePrice: Number(p.minPriceAmount ?? 0),
      minPrice: Number(p.minPriceAmount ?? 0),
      compareAtPrice: variants.find((variant: any) => variant.originalPrice)?.originalPrice,
      currency: p.currency,
      thumbnail: document.thumbnail ?? images.find((image: any) => image.isThumbnail)?.url ?? images[0]?.url ?? "",
      images,
      rating: Number(document.rating ?? 0),
      reviewCount: Number(document.reviewCount ?? 0),
      soldCount: Number(document.soldCount ?? 0),
      specifications: document.specifications ?? [],
      attributes: Object.fromEntries(
        Object.entries(attrs).filter(([k]) => k !== "_document"),
      ),
      variants,
      plans,
      game:
        document.game ??
        (p.type === "DIGITAL_GAME_ACCOUNT"
          ? {
              id: document.gameId ?? p.gameDetail?.gameCatalogId ?? "",
              slug: document.gameSlug ?? "",
              name: document.gameName ?? "Tài khoản game",
              logoUrl: document.gameLogoUrl ?? "",
              platforms: document.platform ? [document.platform] : [],
              servers: document.server ? [document.server] : [],
              attributeSchema: [],
            }
          : undefined),
      gameName: document.gameName ?? document.game?.name,
      platform: document.platform ?? p.gameDetail?.platform ?? "PC",
      server: document.server ?? p.gameDetail?.server ?? "Không xác định",
      publicAttributes: document.publicAttributes ?? document.accountDetails ?? {},
      loginMethod: document.loginMethod ?? p.gameDetail?.loginMethod ?? "USERNAME",
      linkedServices: document.linkedServices ?? [],
      changeability: document.changeability ?? p.gameDetail?.changeability ?? {},
      deliveryMode: document.deliveryMode ?? p.gameDetail?.deliveryMode ?? "SELLER_CONFIRMATION",
      warrantyHours: Number(document.warrantyHours ?? document.warrantyPeriodHours ?? 0),
      availableStock: (p.inventoryItems ?? []).length,
      sellerCommitments: document.sellerCommitments ?? [],
      riskNotices: document.riskNotices ?? [],
      applicationName: document.applicationName ?? document.application?.name,
      platforms: document.platforms ?? document.supportedPlatforms ?? [],
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : document.category,
      brand: p.brand
        ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug }
        : document.brand,
      shop: p.shop
        ? {
            id: p.shop.id,
            name: p.shop.name,
            slug: p.shop.slug,
            rating: Number(p.shop.ratingAverage),
          }
        : document.shop,
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    };
  }

  private include() {
    return {
      variants: true,
      appPlans: true,
      gameDetail: true,
      appDetail: true,
      inventoryItems: { where: { status: "AVAILABLE" as const }, select: { id: true } },
      category: true,
      brand: true,
      shop: true,
    };
  }
  async search(query: any, forcedType?: string) {
    return this.cached("search", { query, forcedType }, 30, () => this.searchUncached(query, forcedType));
  }

  private async searchUncached(query: any, forcedType?: string) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 12)));
    const where: any = { status: "ACTIVE" };
    if (forcedType) where.type = forcedType;
    else if (query.type) where.type = query.type;
    const indexed = await this.productSearch?.search(query, forcedType);
    if (indexed) where.id = { in: indexed.ids };
    else if (query.query)
      where.OR = [
        { name: { contains: String(query.query), mode: "insensitive" } },
        { description: { contains: String(query.query), mode: "insensitive" } },
      ];
    if (query.category) where.category = { slug: query.category };
    if (query.brand) where.brand = { slug: query.brand };
    if (query.minPrice)
      where.minPriceAmount = {
        ...(where.minPriceAmount ?? {}),
        gte: BigInt(query.minPrice),
      };
    if (query.maxPrice)
      where.minPriceAmount = {
        ...(where.minPriceAmount ?? {}),
        lte: BigInt(query.maxPrice),
      };
    const [foundRows, databaseTotal] = await this.db.$transaction([
      this.db.product.findMany({
        where,
        include: this.include(),
        skip: indexed ? undefined : (page - 1) * pageSize,
        take: indexed ? undefined : pageSize,
        orderBy:
          query.sortBy === "PRICE_ASC"
            ? { minPriceAmount: "asc" }
            : query.sortBy === "PRICE_DESC"
              ? { minPriceAmount: "desc" }
              : { createdAt: "desc" },
      }),
      this.db.product.count({ where }),
    ]);
    const rows = indexed
      ? [...foundRows].sort((a, b) => indexed.ids.indexOf(a.id) - indexed.ids.indexOf(b.id))
      : foundRows;
    const total = indexed?.total ?? databaseTotal;
    return {
      success: true,
      data: rows.map((p) => this.productDto(p)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
  async bySlug(slug: string, type?: string) {
    return this.cached("by-slug", { slug, type }, 120, async () => {
      const p = await this.db.product.findFirst({
      where: { slug, ...(type ? { type: type as any } : {}), status: "ACTIVE" },
      include: this.include(),
      });
      return p ? this.productDto(p) : null;
    });
  }
  async byId(id: string, type?: string) {
    return this.cached("by-id", { id, type }, 120, async () => {
      const p = await this.db.product.findFirst({
      where: { id, ...(type ? { type: type as any } : {}), status: "ACTIVE" },
      include: this.include(),
      });
      return p ? this.productDto(p) : null;
    });
  }
  async featured(type?: string) {
    return this.cached("featured", { type }, 60, async () => {
      const rows = await this.db.product.findMany({
      where: { status: "ACTIVE", ...(type ? { type: type as any } : {}) },
      include: this.include(),
      take: 12,
      orderBy: { publishedAt: "desc" },
      });
      return rows.map((p) => this.productDto(p));
    });
  }
  async compare(ids: string) {
    const rows = await this.db.product.findMany({
      where: { id: { in: ids.split(",").slice(0, 4) }, status: "ACTIVE" },
      include: this.include(),
    });
    return rows.map((p) => this.productDto(p));
  }
  async categories() {
    return this.cached("categories", {}, 300, () => this.db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }));
  }
  async brands() {
    return this.cached("brands", {}, 300, () => this.db.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }));
  }
  async docs(kind: string) {
    return (
      await this.db.resourceDocument.findMany({
        where: { kind },
        orderBy: { createdAt: "desc" },
      })
    ).map((x) => ({ ...(x.document as any), id: x.id, slug: x.slug }));
  }
  async docBySlug(kind: string, slug: string) {
    const x = await this.db.resourceDocument.findUnique({
      where: { kind_slug: { kind, slug } },
    });
    return x ? { ...(x.document as any), id: x.id, slug: x.slug } : null;
  }
  async shop(idOrSlug: string) {
    const s = await this.db.shop.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    return s
      ? {
          ...s,
          rating: Number(s.ratingAverage),
          followerCount: 0,
          likeCount: 0,
        }
      : null;
  }
  async shopProducts(id: string) {
    const rows = await this.db.product.findMany({
      where: { shopId: id, status: "ACTIVE" },
      include: this.include(),
    });
    return rows.map((p) => this.productDto(p));
  }
}
