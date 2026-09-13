ALTER TABLE "conversations"
ADD COLUMN "automation_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "handoff_at" TIMESTAMPTZ(6);
