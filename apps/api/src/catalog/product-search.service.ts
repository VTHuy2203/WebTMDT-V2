import { Injectable } from "@nestjs/common";

type SearchResult = { ids: string[]; total: number };

@Injectable()
export class ProductSearchService {
  private readonly baseUrl = process.env.MEILISEARCH_URL?.replace(/\/$/, "");
  private readonly apiKey = process.env.MEILISEARCH_API_KEY;
  readonly enabled = Boolean(this.baseUrl);

  async health() {
    if (!this.baseUrl) return "disabled";
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {},
        signal: AbortSignal.timeout(1500),
      });
      return response.ok ? "up" : "degraded";
    } catch {
      return "degraded";
    }
  }

  private headers() {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  private filter(query: any, forcedType?: string) {
    const filters = ['status = "ACTIVE"'];
    const quote = (value: unknown) => JSON.stringify(String(value));
    const type = forcedType ?? query.type;
    if (type) filters.push(`type = ${quote(type)}`);
    if (query.category) filters.push(`categorySlug = ${quote(query.category)}`);
    if (query.brand) filters.push(`brandSlug = ${quote(query.brand)}`);
    if (query.minPrice != null) filters.push(`minPriceAmount >= ${Number(query.minPrice)}`);
    if (query.maxPrice != null) filters.push(`minPriceAmount <= ${Number(query.maxPrice)}`);
    return filters;
  }

  async search(query: any, forcedType?: string): Promise<SearchResult | null> {
    if (!this.baseUrl || !query.query) return null;
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.pageSize ?? 12)));
    const sort = query.sortBy === "PRICE_ASC"
      ? ["minPriceAmount:asc"]
      : query.sortBy === "PRICE_DESC"
        ? ["minPriceAmount:desc"]
        : undefined;
    try {
      const response = await fetch(`${this.baseUrl}/indexes/products/search`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          q: String(query.query),
          offset: (page - 1) * limit,
          limit,
          filter: this.filter(query, forcedType),
          ...(sort ? { sort } : {}),
          attributesToRetrieve: ["id"],
        }),
        signal: AbortSignal.timeout(Number(process.env.SEARCH_TIMEOUT_MS ?? 1500)),
      });
      if (!response.ok) throw new Error(`Meilisearch returned ${response.status}`);
      const result = (await response.json()) as any;
      return {
        ids: (result.hits ?? []).map((hit: any) => String(hit.id)),
        total: Number(result.estimatedTotalHits ?? result.totalHits ?? 0),
      };
    } catch (error) {
      console.warn("Catalog search fallback to PostgreSQL:", (error as Error).message);
      return null;
    }
  }
}
