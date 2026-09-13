import { Prisma, PrismaClient } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: process.env.WORKER_ENV_FILE ?? "../api/.env" });

const db = new PrismaClient();
const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  { maxRetriesPerRequest: null },
);
const queue = new Queue("marketplace-events", { connection });
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  : null;

async function publishOutbox() {
  const events = await db.$transaction(async (tx) => {
    const rows: Array<{
      id: string;
      event_type: string;
      payload: Prisma.JsonValue;
    }> = await tx.$queryRaw`
      SELECT id, event_type, payload FROM outbox_events
      WHERE status IN ('PENDING', 'FAILED') AND available_at <= now()
      ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 50`;
    if (rows.length)
      await tx.outboxEvent.updateMany({
        where: { id: { in: rows.map((x) => x.id) } },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
    return rows;
  });
  for (const event of events) {
    try {
      await queue.add(event.event_type, event.payload as object, {
        jobId: event.id,
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 1000,
      });
      await db.outboxEvent.update({
        where: { id: event.id },
        data: { status: "PUBLISHED", publishedAt: new Date(), lastError: null },
      });
    } catch (error) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          lastError:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : "Unknown queue error",
          availableAt: new Date(Date.now() + 30000),
        },
      });
    }
  }
}

async function expirePayments() {
  const intents = await db.paymentIntent.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    take: 50,
  });
  for (const intent of intents)
    await db.$transaction(async (tx) => {
      const locked: Array<{ id: string }> =
        await tx.$queryRaw`SELECT id FROM payment_intents WHERE id = ${intent.id}::uuid AND status = 'PENDING' FOR UPDATE`;
      if (!locked.length) return;
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderGroupId: intent.orderGroupId, status: "ACTIVE" },
      });
      for (const reservation of reservations.filter((x) => x.productVariantId))
        await tx.productVariant.update({
          where: { id: reservation.productVariantId! },
          data: {
            stockReserved: { decrement: reservation.quantity },
            version: { increment: 1 },
          },
        });
      await tx.inventoryItem.updateMany({
        where: {
          reservations: {
            some: { orderGroupId: intent.orderGroupId, status: "ACTIVE" },
          },
        },
        data: {
          status: "AVAILABLE",
          reservedUntil: null,
          soldOrderItemId: null,
        },
      });
      await tx.inventoryReservation.updateMany({
        where: { orderGroupId: intent.orderGroupId, status: "ACTIVE" },
        data: { status: "EXPIRED", activeKey: null, releasedAt: new Date() },
      });
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { status: "EXPIRED" },
      });
      await tx.orderGroup.update({
        where: { id: intent.orderGroupId },
        data: { status: "EXPIRED" },
      });
      await tx.order.updateMany({
        where: { orderGroupId: intent.orderGroupId, status: "PENDING_PAYMENT" },
        data: { status: "EXPIRED" },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: "PAYMENT_INTENT",
          aggregateId: intent.id,
          eventType: "PAYMENT_EXPIRED",
          payload: {
            paymentIntentId: intent.id,
            orderGroupId: intent.orderGroupId,
          },
        },
      });
    });
}

const worker = new Worker(
  "marketplace-events",
  async (job) => {
    if (job.name === "NOTIFICATION_CREATED") {
      if (!mailer) return;
      const notification = await db.notification.findUnique({
        where: { id: String(job.data.notificationId) },
        include: { user: true },
      });
      if (!notification?.user.emailNormalized) return;
      await mailer.sendMail({
        from: process.env.SMTP_FROM ?? "no-reply@marketplace.local",
        to: notification.user.emailNormalized,
        subject: notification.title,
        text: notification.body,
      });
      return;
    }
    if (job.name !== "PAYMENT_CONFIRMED") return;
    const orderGroupId = String(job.data.orderGroupId);
    const group = await db.orderGroup.findUnique({ where: { id: orderGroupId } });
    const items = await db.orderItem.findMany({
      where: { order: { orderGroupId }, productType: { not: "PHYSICAL" } },
      include: { soldInventory: true, snapshot: true },
    });
    for (const item of items) {
      for (const inventory of item.soldInventory)
        await db.digitalDelivery.upsert({
          where: {
            orderItemId_inventoryItemId: {
              orderItemId: item.id,
              inventoryItemId: inventory.id,
            },
          },
          create: {
            orderItemId: item.id,
            inventoryItemId: inventory.id,
            status: "READY",
            readyAt: new Date(),
          },
          update: {},
        });
      if (
        !(await db.warranty.findUnique({ where: { orderItemId: item.id } }))
      ) {
        const value = item.snapshot?.warrantyDurationValue ?? 0;
        const endsAt = new Date();
        const unit = item.snapshot?.warrantyDurationUnit ?? "MONTH";
        if (unit === "DAY") endsAt.setUTCDate(endsAt.getUTCDate() + value);
        else if (unit === "YEAR") endsAt.setUTCFullYear(endsAt.getUTCFullYear() + value);
        else endsAt.setUTCMonth(endsAt.getUTCMonth() + value);
        await db.warranty.create({
          data: {
            orderItemId: item.id,
            startsAt: new Date(),
            endsAt,
            policySnapshot: {
              value,
              unit,
            },
          },
        });
      }
    }
    if (group) {
      const notification = await db.notification.create({
        data: {
          userId: group.buyerId,
          type: "PAYMENT_CONFIRMED",
          title: "Thanh toán thành công",
          body: `Đơn hàng ${group.code} đã được thanh toán thành công.`,
          data: { orderGroupId },
        },
      });
      await db.outboxEvent.create({
        data: {
          aggregateType: "NOTIFICATION",
          aggregateId: notification.id,
          eventType: "NOTIFICATION_CREATED",
          payload: { notificationId: notification.id, userId: group.buyerId },
        },
      });
    }
  },
  { connection, concurrency: 10 },
);

worker.on("failed", (job, error) =>
  console.error(
    JSON.stringify({
      event: "job_failed",
      jobId: job?.id,
      error: error.message,
    }),
  ),
);
setInterval(() => void publishOutbox(), 1000).unref();
setInterval(() => void expirePayments(), 10000).unref();

async function start() {
  await db.$connect();
  await publishOutbox();
  console.log("Marketplace worker started");
}

void start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function shutdown() {
  await worker.close();
  await queue.close();
  await connection.quit();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
