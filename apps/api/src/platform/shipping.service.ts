import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationService } from "./notification.service";

@Injectable()
export class ShippingService {
  constructor(
    private readonly db: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(user: any, orderId: string, input: any) {
    const order = await this.db.order.findFirst({
      where: {
        id: orderId,
        shop: { members: { some: { userId: user.id } } },
        items: { some: { productType: "PHYSICAL" } },
      },
      include: { group: true },
    });
    if (!order) throw new NotFoundException();
    if (
      !user.roles.some((role: string) =>
        ["SELLER", "SELLER_OWNER", "SELLER_MANAGER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"].includes(role),
      )
    )
      throw new ForbiddenException();
    const existing = await this.db.shipment.findUnique({ where: { orderId } });
    if (existing) return existing;
    const provider = String(input.provider ?? process.env.SHIPPING_PROVIDER ?? "LOCAL").toUpperCase();
    let providerResult: any = {};
    if (process.env.SHIPPING_API_URL && provider !== "LOCAL") {
      const response = await fetch(`${process.env.SHIPPING_API_URL}/shipments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.SHIPPING_API_TOKEN ?? ""}`,
        },
        body: JSON.stringify({ orderCode: order.code, address: order.shippingAddress, ...input }),
      });
      if (!response.ok) throw new Error(`Shipping provider returned ${response.status}`);
      providerResult = await response.json();
    }
    const trackingNumber = String(providerResult.trackingNumber ?? `LOCAL${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`);
    const shipment = await this.db.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId,
          provider,
          trackingNumber,
          labelUrl: providerResult.labelUrl ?? `/api/v1/orders/${orderId}/shipment/label`,
          shippingFee: order.shippingAmount,
          events: [{ status: "CREATED", occurredAt: new Date().toISOString() }],
        },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
      return created;
    });
    await this.notifications.create(order.group.buyerId, "SHIPMENT_CREATED", "Đơn hàng đang được chuẩn bị", `Mã vận đơn: ${trackingNumber}`, { orderId, trackingNumber });
    return shipment;
  }

  async get(userId: string, roles: string[], orderId: string) {
    const shipment = await this.db.shipment.findFirst({
      where: {
        orderId,
        order: roles.some((x) => ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(x))
          ? {}
          : { OR: [{ group: { buyerId: userId } }, { shop: { members: { some: { userId } } } }] },
      },
    });
    if (!shipment) throw new NotFoundException();
    return shipment;
  }

  async webhook(provider: string, signature: string, rawBody: Buffer | undefined, input: any) {
    const secret = process.env.SHIPPING_WEBHOOK_SECRET;
    if (!secret) throw new ForbiddenException({ code: "WEBHOOK_DISABLED", message: "Shipping webhook chưa cấu hình" });
    const supplied = signature.replace(/^sha256=/, "");
    const expected = createHmac("sha256", secret).update(rawBody ?? Buffer.from(JSON.stringify(input))).digest("hex");
    if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))
      throw new ForbiddenException({ code: "INVALID_SIGNATURE", message: "Chữ ký webhook không hợp lệ" });
    const externalId = String(input.eventId ?? input.id ?? "");
    const trackingNumber = String(input.trackingNumber ?? "");
    const status = String(input.status ?? "").toUpperCase();
    if (!externalId || !trackingNumber || !status) throw new NotFoundException();
    const prior = await this.db.inboundWebhook.findUnique({
      where: { provider_externalId: { provider, externalId } },
    });
    if (prior) return { accepted: true, duplicate: true };
    const shipment = await this.db.shipment.findUnique({ where: { trackingNumber }, include: { order: { include: { group: true } } } });
    if (!shipment) throw new NotFoundException();
    const mappedOrderStatus: Record<string, any> = {
      PICKED_UP: "PROCESSING",
      IN_TRANSIT: "SHIPPING",
      DELIVERED: "DELIVERED",
      RETURNED: "RETURNED",
    };
    await this.db.$transaction(async (tx) => {
      await tx.inboundWebhook.create({
        data: { provider, externalId, eventType: "SHIPMENT_STATUS", payload: input, status: "PROCESSED", processedAt: new Date() },
      });
      const events = Array.isArray(shipment.events) ? shipment.events : [];
      await tx.shipment.update({
        where: { id: shipment.id },
        data: { status, events: [...events, { status, occurredAt: input.occurredAt ?? new Date().toISOString() }] },
      });
      if (mappedOrderStatus[status])
        await tx.order.update({ where: { id: shipment.orderId }, data: { status: mappedOrderStatus[status] } });
    });
    await this.notifications.create(shipment.order.group.buyerId, "SHIPMENT_UPDATED", "Cập nhật vận chuyển", `Đơn hàng ${shipment.order.code}: ${status}`, { orderId: shipment.orderId, status });
    return { accepted: true, duplicate: false };
  }
}
