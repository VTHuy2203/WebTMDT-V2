CREATE INDEX IF NOT EXISTS "products_brand_id_status_min_price_amount_idx"
  ON "products"("brand_id", "status", "min_price_amount");

CREATE INDEX IF NOT EXISTS "products_status_published_at_idx"
  ON "products"("status", "published_at" DESC);
