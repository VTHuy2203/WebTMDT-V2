-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "SellerApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShopMemberRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL_GAME_ACCOUNT', 'DIGITAL_APP_ACCOUNT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppFulfillmentType" AS ENUM ('PRE_CREATED_ACCOUNT', 'LICENSE_KEY', 'BUYER_EMAIL_ACTIVATION', 'FAMILY_OR_TEAM_INVITATION', 'MANUAL_SERVICE');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('PHYSICAL_UNIT', 'GAME_CREDENTIAL', 'APP_CREDENTIAL', 'LICENSE_KEY', 'SLOT');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'DELIVERED', 'DISABLED', 'QUARANTINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PAID', 'EXPIRED', 'REVIEW_REQUIRED', 'REJECTED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('OPEN', 'MATCHED', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_AVAILABLE', 'PREPARING', 'READY', 'REVEALED', 'REPORTED');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CLAIMED', 'VOID');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'SELLER_RESPONSE_PENDING', 'ADMIN_REVIEW', 'RESOLVED_REPLACED', 'RESOLVED_REFUNDED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerTransactionStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email_normalized" TEXT,
    "phone_normalized" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_family_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "reuse_detected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotated_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "seller_applications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "status" "SellerApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "business_type" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "tax_code" TEXT,
    "encrypted_kyc" BYTEA,
    "key_version" INTEGER,
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seller_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "seller_application_id" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'DRAFT',
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_members" (
    "shop_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ShopMemberRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_members_pkey" PRIMARY KEY ("shop_id","user_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attribute_schema" JSONB NOT NULL DEFAULT '{}',
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "category_id" UUID,
    "brand_id" UUID,
    "product_type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "min_price_amount" BIGINT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "attribute_version" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "first_ordered_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_product_details" (
    "product_id" UUID NOT NULL,
    "weight_grams" INTEGER,
    "warranty_months" INTEGER,

    CONSTRAINT "physical_product_details_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "game_account_details" (
    "product_id" UUID NOT NULL,
    "game_catalog_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "server" TEXT,
    "login_method" TEXT NOT NULL,
    "delivery_mode" TEXT NOT NULL,
    "changeability" JSONB NOT NULL DEFAULT '{}',
    "warranty_duration_value" INTEGER NOT NULL,
    "warranty_duration_unit" "DurationUnit" NOT NULL,

    CONSTRAINT "game_account_details_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "app_account_details" (
    "product_id" UUID NOT NULL,
    "application_catalog_id" UUID NOT NULL,
    "setup_guide" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "app_account_details_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_amount" BIGINT NOT NULL,
    "compare_at_amount" BIGINT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "stock_on_hand" INTEGER NOT NULL DEFAULT 0,
    "stock_reserved" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_plans" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_amount" BIGINT NOT NULL,
    "compare_at_amount" BIGINT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "fulfillment_type" "AppFulfillmentType" NOT NULL,
    "service_duration_value" INTEGER NOT NULL,
    "service_duration_unit" "DurationUnit" NOT NULL,
    "warranty_duration_value" INTEGER NOT NULL,
    "warranty_duration_unit" "DurationUnit" NOT NULL,
    "delivery_estimate_minutes" INTEGER,
    "purchase_limit" INTEGER,
    "buyer_field_schema" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "app_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "app_plan_id" UUID,
    "inventory_type" "InventoryType" NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'DRAFT',
    "internal_code" TEXT NOT NULL,
    "masked_identifier" TEXT,
    "encrypted_payload" BYTEA,
    "encrypted_data_key" BYTEA,
    "payload_nonce" BYTEA,
    "payload_auth_tag" BYTEA,
    "payload_key_version" INTEGER,
    "reserved_until" TIMESTAMPTZ(6),
    "sold_order_item_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID,
    "product_variant_id" UUID,
    "order_group_id" UUID NOT NULL,
    "payment_intent_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "active_key" VARCHAR(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "product_variant_id" UUID,
    "app_plan_id" UUID,
    "quantity" INTEGER NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "buyer_fields" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_groups" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal_amount" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL DEFAULT 0,
    "shipping_amount" BIGINT NOT NULL DEFAULT 0,
    "tax_amount" BIGINT NOT NULL DEFAULT 0,
    "total_amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_group_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal_amount" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL DEFAULT 0,
    "shipping_amount" BIGINT NOT NULL DEFAULT 0,
    "tax_amount" BIGINT NOT NULL DEFAULT 0,
    "total_amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "shipping_address" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "app_plan_id" UUID,
    "product_type" "ProductType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_amount" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_snapshots" (
    "order_item_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT,
    "plan_name" TEXT,
    "product_type" "ProductType" NOT NULL,
    "fulfillment_type" "AppFulfillmentType",
    "service_duration_value" INTEGER,
    "service_duration_unit" "DurationUnit",
    "warranty_duration_value" INTEGER,
    "warranty_duration_unit" "DurationUnit",
    "policy" JSONB NOT NULL DEFAULT '{}',
    "pricing" JSONB NOT NULL,
    "buyer_field_schema" JSONB,
    "buyer_provided_values" JSONB,

    CONSTRAINT "order_item_snapshots_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" UUID NOT NULL,
    "order_group_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "payment_code" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "provider_data" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "payment_intent_id" UUID,
    "provider" TEXT NOT NULL,
    "external_transaction_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "transfer_content" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payment_transaction_id" UUID,
    "payload_hash" TEXT NOT NULL,
    "payload_encrypted" BYTEA,
    "signature_valid" BOOLEAN NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_reconciliations" (
    "id" UUID NOT NULL,
    "payment_intent_id" UUID,
    "payment_transaction_id" UUID NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'OPEN',
    "reason_code" TEXT NOT NULL,
    "notes" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_deliveries" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "inventory_item_id" UUID,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PREPARING',
    "reveal_count" INTEGER NOT NULL DEFAULT 0,
    "ready_at" TIMESTAMPTZ(6),
    "revealed_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_claims" (
    "id" UUID NOT NULL,
    "warranty_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "issue" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "item_ids" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_images" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requested_refund_amount" BIGINT NOT NULL,
    "actual_refund_amount" BIGINT,
    "seller_notes" TEXT,
    "admin_notes" TEXT,
    "return_tracking_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "opened_by_user_id" UUID NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "issue_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "desired_solution" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "shop_id" UUID,
    "owner_type" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "available_amount" BIGINT NOT NULL DEFAULT 0,
    "pending_amount" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "posted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "ledger_transaction_id" UUID NOT NULL,
    "wallet_id" UUID,
    "account_code" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "method" VARCHAR(8) NOT NULL,
    "route" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status_code" INTEGER,
    "response_body" JSONB,
    "locked_until" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "reason" TEXT,
    "request_id" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_documents" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "owner_id" UUID,
    "shop_id" UUID,
    "slug" TEXT,
    "status" TEXT,
    "document" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "resource_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_objects" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "object_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "entity_type" TEXT,
    "entity_id" UUID,
    "public_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "order_id" UUID,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "last_read_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "label_url" TEXT,
    "shipping_fee" BIGINT NOT NULL DEFAULT 0,
    "events" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitted_data" JSONB NOT NULL DEFAULT '{}',
    "result_data" JSONB NOT NULL DEFAULT '{}',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_webhooks" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "inbound_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_engagements" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_reviews" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shop_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "bank_info" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_normalized_key" ON "users"("phone_normalized");

-- CreateIndex
CREATE INDEX "users_status_created_at_idx" ON "users"("status", "created_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_token_family_id_idx" ON "sessions"("token_family_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "seller_applications_status_submitted_at_idx" ON "seller_applications"("status", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "shops_seller_application_id_key" ON "shops"("seller_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE INDEX "shops_status_created_at_idx" ON "shops"("status", "created_at");

-- CreateIndex
CREATE INDEX "shop_members_user_id_is_active_idx" ON "shop_members"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_is_active_idx" ON "categories"("parent_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_shop_id_status_created_at_idx" ON "products"("shop_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "products_category_id_status_min_price_amount_idx" ON "products"("category_id", "status", "min_price_amount");

-- CreateIndex
CREATE INDEX "products_product_type_status_created_at_idx" ON "products"("product_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "game_account_details_game_catalog_id_platform_server_idx" ON "game_account_details"("game_catalog_id", "platform", "server");

-- CreateIndex
CREATE INDEX "app_account_details_application_catalog_id_idx" ON "app_account_details"("application_catalog_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_active_idx" ON "product_variants"("product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_sku_key" ON "product_variants"("product_id", "sku");

-- CreateIndex
CREATE INDEX "app_plans_product_id_status_idx" ON "app_plans"("product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "app_plans_product_id_sku_key" ON "app_plans"("product_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_items_app_plan_id_status_created_at_idx" ON "inventory_items"("app_plan_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "inventory_items_product_id_status_created_at_idx" ON "inventory_items"("product_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "inventory_items_sold_order_item_id_idx" ON "inventory_items"("sold_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_product_id_internal_code_key" ON "inventory_items"("product_id", "internal_code");

-- CreateIndex
CREATE INDEX "inventory_reservations_order_group_id_status_idx" ON "inventory_reservations"("order_group_id", "status");

-- CreateIndex
CREATE INDEX "inventory_reservations_status_expires_at_idx" ON "inventory_reservations"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservations_inventory_item_id_active_key_key" ON "inventory_reservations"("inventory_item_id", "active_key");

-- CreateIndex
CREATE INDEX "carts_user_id_status_idx" ON "carts"("user_id", "status");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_selected_idx" ON "cart_items"("cart_id", "selected");

-- CreateIndex
CREATE INDEX "checkout_sessions_user_id_expires_at_idx" ON "checkout_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_groups_code_key" ON "order_groups"("code");

-- CreateIndex
CREATE INDEX "order_groups_buyer_id_status_created_at_idx" ON "order_groups"("buyer_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE INDEX "orders_shop_id_status_created_at_idx" ON "orders"("shop_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_group_id_shop_id_key" ON "orders"("order_group_id", "shop_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_created_at_idx" ON "order_items"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_payment_code_key" ON "payment_intents"("payment_code");

-- CreateIndex
CREATE INDEX "payment_intents_order_group_id_status_idx" ON "payment_intents"("order_group_id", "status");

-- CreateIndex
CREATE INDEX "payment_intents_status_expires_at_idx" ON "payment_intents"("status", "expires_at");

-- CreateIndex
CREATE INDEX "payment_transactions_payment_intent_id_occurred_at_idx" ON "payment_transactions"("payment_intent_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_external_transaction_id_key" ON "payment_transactions"("provider", "external_transaction_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_processed_at_received_at_idx" ON "payment_webhook_events"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_provider_event_id_key" ON "payment_webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_reconciliations_payment_transaction_id_key" ON "payment_reconciliations"("payment_transaction_id");

-- CreateIndex
CREATE INDEX "payment_reconciliations_status_created_at_idx" ON "payment_reconciliations"("status", "created_at");

-- CreateIndex
CREATE INDEX "digital_deliveries_order_item_id_status_idx" ON "digital_deliveries"("order_item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "digital_deliveries_order_item_id_inventory_item_id_key" ON "digital_deliveries"("order_item_id", "inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "warranties_order_item_id_key" ON "warranties"("order_item_id");

-- CreateIndex
CREATE INDEX "warranties_status_ends_at_idx" ON "warranties"("status", "ends_at");

-- CreateIndex
CREATE INDEX "warranty_claims_warranty_id_status_created_at_idx" ON "warranty_claims"("warranty_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "warranty_claims_user_id_created_at_idx" ON "warranty_claims"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "return_requests_order_id_status_created_at_idx" ON "return_requests"("order_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "return_requests_buyer_id_created_at_idx" ON "return_requests"("buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "disputes_order_id_status_idx" ON "disputes"("order_id", "status");

-- CreateIndex
CREATE INDEX "disputes_status_created_at_idx" ON "disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "wallets_shop_id_idx" ON "wallets"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_owner_type_owner_id_currency_key" ON "wallets"("owner_type", "owner_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_idempotency_key_key" ON "ledger_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_transactions_reference_type_reference_id_idx" ON "ledger_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "ledger_entries_wallet_id_created_at_idx" ON "ledger_entries"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_ledger_transaction_id_idx" ON "ledger_entries"("ledger_transaction_id");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_actor_id_method_route_key_key" ON "idempotency_records"("actor_id", "method", "route", "key");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_created_at_idx" ON "audit_logs"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "resource_documents_kind_status_created_at_idx" ON "resource_documents"("kind", "status", "created_at");

-- CreateIndex
CREATE INDEX "resource_documents_kind_owner_id_created_at_idx" ON "resource_documents"("kind", "owner_id", "created_at");

-- CreateIndex
CREATE INDEX "resource_documents_kind_shop_id_created_at_idx" ON "resource_documents"("kind", "shop_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "resource_documents_kind_slug_key" ON "resource_documents"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_objects_object_key_key" ON "media_objects"("object_key");

-- CreateIndex
CREATE INDEX "media_objects_owner_id_status_created_at_idx" ON "media_objects"("owner_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "media_objects_entity_type_entity_id_idx" ON "media_objects"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "conversations_order_id_updated_at_idx" ON "conversations"("order_id", "updated_at");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_joined_at_idx" ON "conversation_participants"("user_id", "joined_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "shipments_provider_status_updated_at_idx" ON "shipments"("provider", "status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_user_id_key" ON "identity_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_external_id_key" ON "identity_verifications"("external_id");

-- CreateIndex
CREATE INDEX "identity_verifications_status_submitted_at_idx" ON "identity_verifications"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "inbound_webhooks_provider_status_received_at_idx" ON "inbound_webhooks"("provider", "status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_webhooks_provider_external_id_key" ON "inbound_webhooks"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "account_tokens_user_id_type_expires_at_idx" ON "account_tokens"("user_id", "type", "expires_at");

-- CreateIndex
CREATE INDEX "shop_engagements_shop_id_type_idx" ON "shop_engagements"("shop_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "shop_engagements_shop_id_user_id_type_key" ON "shop_engagements"("shop_id", "user_id", "type");

-- CreateIndex
CREATE INDEX "shop_reviews_shop_id_product_id_created_at_idx" ON "shop_reviews"("shop_id", "product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "shop_reviews_user_id_order_id_product_id_key" ON "shop_reviews"("user_id", "order_id", "product_id");

-- CreateIndex
CREATE INDEX "payout_requests_shop_id_status_requested_at_idx" ON "payout_requests"("shop_id", "status", "requested_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_applications" ADD CONSTRAINT "seller_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_seller_application_id_fkey" FOREIGN KEY ("seller_application_id") REFERENCES "seller_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_product_details" ADD CONSTRAINT "physical_product_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_account_details" ADD CONSTRAINT "game_account_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_account_details" ADD CONSTRAINT "app_account_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_plans" ADD CONSTRAINT "app_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_app_plan_id_fkey" FOREIGN KEY ("app_plan_id") REFERENCES "app_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_sold_order_item_id_fkey" FOREIGN KEY ("sold_order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_group_id_fkey" FOREIGN KEY ("order_group_id") REFERENCES "order_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_app_plan_id_fkey" FOREIGN KEY ("app_plan_id") REFERENCES "app_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_groups" ADD CONSTRAINT "order_groups_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_group_id_fkey" FOREIGN KEY ("order_group_id") REFERENCES "order_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_app_plan_id_fkey" FOREIGN KEY ("app_plan_id") REFERENCES "app_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_snapshots" ADD CONSTRAINT "order_item_snapshots_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_order_group_id_fkey" FOREIGN KEY ("order_group_id") REFERENCES "order_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_deliveries" ADD CONSTRAINT "digital_deliveries_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_deliveries" ADD CONSTRAINT "digital_deliveries_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "warranties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ledger_transaction_id_fkey" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_engagements" ADD CONSTRAINT "shop_engagements_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_engagements" ADD CONSTRAINT "shop_engagements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
