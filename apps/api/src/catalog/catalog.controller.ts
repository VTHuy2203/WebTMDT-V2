import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("products/search") searchLegacy(@Query() q: any) {
    return this.catalog.search(q);
  }
  @Get("products/featured") featured() {
    return this.catalog.featured();
  }
  @Get("products/compare") compare(@Query("ids") ids = "") {
    return this.catalog.compare(ids);
  }
  @Get("products/slug/:slug") productSlugLegacy(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug);
  }
  @Get("products/:id") productId(@Param("id") id: string) {
    return this.catalog.byId(id);
  }
  @Get("products") products(@Query() q: any) {
    return this.catalog.search(q);
  }
  @Get("categories") categories() {
    return this.catalog.categories();
  }
  @Get("brands") brands() {
    return this.catalog.brands();
  }
  @Get("categories/:slug/tech-filters") async filters(
    @Param("slug") slug: string,
  ) {
    const category = (await this.catalog.categories()).find(
      (x) => x.slug === slug,
    );
    return category ? Object.values(category.attributeSchema as any) : [];
  }
  @Get("game-accounts/games") games() {
    return this.catalog.docs("GAME_CATALOG");
  }
  @Get("game-accounts/games/:slug") game(@Param("slug") slug: string) {
    return this.catalog.docBySlug("GAME_CATALOG", slug);
  }
  @Get("game-accounts/search") gamesSearch(@Query() q: any) {
    return this.catalog.search(q, "DIGITAL_GAME_ACCOUNT");
  }
  @Get("game-accounts/featured") gamesFeatured() {
    return this.catalog.featured("DIGITAL_GAME_ACCOUNT");
  }
  @Get("game-accounts/slug/:slug") gameProductSlug(
    @Param("slug") slug: string,
  ) {
    return this.catalog.bySlug(slug, "DIGITAL_GAME_ACCOUNT");
  }
  @Get("game-accounts/:id") gameProduct(@Param("id") id: string) {
    return this.catalog.byId(id, "DIGITAL_GAME_ACCOUNT");
  }
  @Get("app-accounts/applications") apps() {
    return this.catalog.docs("APP_CATALOG");
  }
  @Get("app-accounts/applications/:slug") app(@Param("slug") slug: string) {
    return this.catalog.docBySlug("APP_CATALOG", slug);
  }
  @Get("app-accounts/search") appsSearch(@Query() q: any) {
    return this.catalog.search(q, "DIGITAL_APP_ACCOUNT");
  }
  @Get("app-accounts/featured") appsFeatured() {
    return this.catalog.featured("DIGITAL_APP_ACCOUNT");
  }
  @Get("app-accounts/slug/:slug") appProductSlug(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug, "DIGITAL_APP_ACCOUNT");
  }
  @Get("app-accounts/:id") appProduct(@Param("id") id: string) {
    return this.catalog.byId(id, "DIGITAL_APP_ACCOUNT");
  }
  @Get("shops/:id/products") shopProducts(@Param("id") id: string) {
    return this.catalog.shopProducts(id);
  }
  @Get("shops/:id") shop(@Param("id") id: string) {
    return this.catalog.shop(id);
  }
}
