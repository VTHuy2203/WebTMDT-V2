import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationService } from "./notification.service";

@Injectable()
export class ShippingService {
  private readonly ghnLocationCache = new Map<string, { districtId: number; wardCode: string; expiresAt: number }>();
  constructor(
    private readonly db: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  private normalizedLocation(value: unknown) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\b(thanh pho|tinh|tp|quan|huyen|thi xa|phuong|xa|thi tran)\b/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  private findLocation(rows: any[], value: unknown, nameKey: string) {
    const expected = this.normalizedLocation(value);
    return rows.find((row) =>
      [row[nameKey], ...(row.NameExtension ?? row.extension_names ?? [])]
        .some((name) => this.normalizedLocation(name) === expected),
    );
  }

  private async resolveLegacyGhnAddress(destination: any, token: string, shopId: string) {
    const cacheKey = [destination.province, destination.district, destination.ward].map((x) => this.normalizedLocation(x)).join(":");
    const cached = this.ghnLocationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached;
    if (!destination.province || !destination.district || !destination.ward)
      throw new BadRequestException({ code: "SHIPPING_ADDRESS_INCOMPLETE", message: "Địa chỉ cần đủ tỉnh/thành, quận/huyện và phường/xã" });
    const baseUrl = (process.env.GHN_API_URL ?? "https://dev-online-gateway.ghn.vn/shiip/public-api").replace(/\/$/, "");
    const headers = { "content-type": "application/json", Token: token, ShopId: shopId };
    const load = async (path: string, body?: object) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: body ? "POST" : "GET",
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(Number(process.env.SHIPPING_TIMEOUT_MS ?? 5000)),
      });
      const payload = await response.json() as any;
      if (!response.ok || payload?.code !== 200 || !Array.isArray(payload?.data))
        throw new ServiceUnavailableException({ code: "GHN_LOCATION_UNAVAILABLE", message: "Không thể tải danh mục địa chỉ GHN" });
      return payload.data;
    };
    const province = this.findLocation(await load("/master-data/province"), destination.province, "ProvinceName");
    if (!province) throw new BadRequestException({ code: "GHN_PROVINCE_NOT_FOUND", message: "Tỉnh/thành không khớp danh mục GHN" });
    const district = this.findLocation(
      await load("/master-data/district", { province_id: Number(province.ProvinceID) }),
      destination.district,
      "DistrictName",
    );
    if (!district) throw new BadRequestException({ code: "GHN_DISTRICT_NOT_FOUND", message: "Quận/huyện không khớp danh mục GHN" });
    const ward = this.findLocation(
      await load("/master-data/ward", { district_id: Number(district.DistrictID) }),
      destination.ward,
      "WardName",
    );
    if (!ward) throw new BadRequestException({ code: "GHN_WARD_NOT_FOUND", message: "Phường/xã không khớp danh mục GHN" });
    const resolved = { districtId: Number(district.DistrictID), wardCode: String(ward.WardCode), expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
    this.ghnLocationCache.set(cacheKey, resolved);
    return resolved;
  }

  async quote(input: any) {
    const provider = String(input.provider ?? process.env.SHIPPING_PROVIDER ?? "LOCAL").toUpperCase();
    if (provider === "LOCAL")
      return {
        provider,
        serviceId: "LOCAL_STANDARD",
        fee: Number(process.env.LOCAL_SHIPPING_FEE ?? 30000),
      };
    if (provider !== "GHN")
      throw new BadRequestException({ code: "UNSUPPORTED_SHIPPING_PROVIDER", message: `Nhà vận chuyển ${provider} chưa được hỗ trợ` });

    const token = process.env.GHN_TOKEN;
    const shopId = process.env.GHN_SHOP_ID;
    const fromDistrictId = Number(input.origin?.districtId ?? process.env.GHN_FROM_DISTRICT_ID);
    let toDistrictId = Number(input.destination?.districtId ?? input.destination?.district_id);
    let toWardCode = String(input.destination?.wardCode ?? input.destination?.ward_code ?? "");
    if (!token || !shopId || !Number.isInteger(fromDistrictId))
      throw new ServiceUnavailableException({ code: "GHN_NOT_CONFIGURED", message: "GHN chưa được cấu hình đầy đủ" });
    if (!Number.isInteger(toDistrictId) || !toWardCode) {
      const resolved = await this.resolveLegacyGhnAddress(input.destination ?? {}, token, shopId);
      toDistrictId = resolved.districtId;
      toWardCode = resolved.wardCode;
    }

    const items = Array.isArray(input.items) ? input.items : [];
    const weight = Math.max(1, items.reduce(
      (sum: number, item: any) => sum + Number(item.weightGrams ?? process.env.DEFAULT_ITEM_WEIGHT_GRAMS ?? 500) * Number(item.quantity ?? 1),
      0,
    ));
    if (weight > 50000)
      throw new BadRequestException({ code: "PARCEL_TOO_HEAVY", message: "GHN chỉ nhận kiện hàng tối đa 50 kg" });
    const baseUrl = (process.env.GHN_API_URL ?? "https://dev-online-gateway.ghn.vn/shiip/public-api").replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/v2/shipping-order/fee`, {
        method: "POST",
        headers: { "content-type": "application/json", Token: token, ShopId: shopId },
        body: JSON.stringify({
          service_id: input.serviceId ? Number(input.serviceId) : undefined,
          service_type_id: input.serviceId ? undefined : Number(process.env.GHN_SERVICE_TYPE_ID ?? (weight >= 20000 ? 5 : 2)),
          from_district_id: fromDistrictId,
          to_district_id: toDistrictId,
          to_ward_code: toWardCode,
          weight,
          length: Number(process.env.DEFAULT_PARCEL_LENGTH_CM ?? 20),
          width: Number(process.env.DEFAULT_PARCEL_WIDTH_CM ?? 15),
          height: Number(process.env.DEFAULT_PARCEL_HEIGHT_CM ?? 10),
          insurance_value: Math.max(0, Math.min(Number(input.orderValue ?? 0), 5_000_000)),
        }),
        signal: AbortSignal.timeout(Number(process.env.SHIPPING_TIMEOUT_MS ?? 5000)),
      });
      const payload = await response.json() as any;
      if (!response.ok || payload?.code !== 200 || !Number.isFinite(Number(payload?.data?.total)))
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      return { provider, serviceId: input.serviceId ?? process.env.GHN_SERVICE_TYPE_ID ?? 2, fee: Number(payload.data.total) };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new ServiceUnavailableException({
        code: "SHIPPING_QUOTE_UNAVAILABLE",
        message: "Không thể lấy phí vận chuyển từ GHN. Vui lòng thử lại.",
      });
    }
  }

  async create(user: any, orderId: string, input: any) {
    const order = await this.db.order.findFirst({
      where: {
        id: orderId,
        shop: { members: { some: { userId: user.id } } },
        items: { some: { productType: "PHYSICAL" } },
      },
      include: {
        group: true,
        items: {
          where: { productType: "PHYSICAL" },
          include: { snapshot: true, product: { include: { physicalDetail: true } } },
        },
      },
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
    if (provider === "GHN") {
      const address = (order.shippingAddress ?? {}) as any;
      const token = process.env.GHN_TOKEN;
      const shopId = process.env.GHN_SHOP_ID;
      const toName = String(address.recipientName ?? address.fullName ?? address.name ?? input.toName ?? "");
      const toPhone = String(address.phone ?? address.phoneNumber ?? input.toPhone ?? "");
      const toAddress = String(address.streetAddress ?? address.addressLine ?? address.address ?? input.toAddress ?? "");
      const toWardCode = String(address.wardCode ?? address.ward_code ?? input.toWardCode ?? "");
      const toDistrictId = Number(address.districtId ?? address.district_id ?? input.toDistrictId);
      if (!token || !shopId)
        throw new ServiceUnavailableException({ code: "GHN_NOT_CONFIGURED", message: "GHN chưa được cấu hình đầy đủ" });
      if (!toName || !toPhone || !toAddress || !address.ward || !address.province)
        throw new BadRequestException({ code: "SHIPPING_ADDRESS_INCOMPLETE", message: "Địa chỉ giao hàng chưa đủ dữ liệu GHN" });
      const baseUrl = (process.env.GHN_API_URL ?? "https://dev-online-gateway.ghn.vn/shiip/public-api").replace(/\/$/, "");
      const totalWeight = order.items.reduce(
        (sum: number, item: any) => sum + Number(item.product.physicalDetail?.weightGrams ?? process.env.DEFAULT_ITEM_WEIGHT_GRAMS ?? 500) * item.quantity,
        0,
      );
      const response = await fetch(`${baseUrl}/v2/shipping-order/create`, {
        method: "POST",
        headers: { "content-type": "application/json", Token: token, ShopId: shopId },
        body: JSON.stringify({
          client_order_code: order.code,
          payment_type_id: Number(process.env.GHN_PAYMENT_TYPE_ID ?? 1),
          required_note: process.env.GHN_REQUIRED_NOTE ?? "KHONGCHOXEMHANG",
          to_name: toName,
          to_phone: toPhone,
          to_address: toAddress,
          to_ward_name: address.ward,
          to_district_name: address.district ?? "",
          to_province_name: address.province,
          is_new_to_address: process.env.GHN_NEW_ADDRESS_MODEL === "true",
          ...(toWardCode ? { to_ward_code: toWardCode } : {}),
          ...(Number.isInteger(toDistrictId) ? { to_district_id: toDistrictId } : {}),
          cod_amount: Number(input.codAmount ?? 0),
          insurance_value: Math.max(0, Math.min(Number(order.subtotalAmount), 5_000_000)),
          service_type_id: Number(input.serviceTypeId ?? process.env.GHN_SERVICE_TYPE_ID ?? 2),
          weight: Math.max(1, totalWeight),
          length: Number(process.env.DEFAULT_PARCEL_LENGTH_CM ?? 20),
          width: Number(process.env.DEFAULT_PARCEL_WIDTH_CM ?? 15),
          height: Number(process.env.DEFAULT_PARCEL_HEIGHT_CM ?? 10),
          items: order.items.map((item: any) => ({
            name: item.snapshot?.productName ?? "Sản phẩm",
            code: item.snapshot?.sku ?? item.productId,
            quantity: item.quantity,
            price: Number(item.unitPriceAmount),
            weight: Number(item.product.physicalDetail?.weightGrams ?? process.env.DEFAULT_ITEM_WEIGHT_GRAMS ?? 500),
            length: Number(process.env.DEFAULT_PARCEL_LENGTH_CM ?? 20),
            width: Number(process.env.DEFAULT_PARCEL_WIDTH_CM ?? 15),
            height: Number(process.env.DEFAULT_PARCEL_HEIGHT_CM ?? 10),
          })),
        }),
        signal: AbortSignal.timeout(Number(process.env.SHIPPING_TIMEOUT_MS ?? 5000)),
      });
      const payload = await response.json() as any;
      if (!response.ok || payload?.code !== 200 || !payload?.data?.order_code)
        throw new ServiceUnavailableException({ code: "SHIPMENT_CREATE_FAILED", message: payload?.message ?? "GHN không thể tạo vận đơn" });
      providerResult = {
        trackingNumber: payload.data.order_code,
        expectedDeliveryAt: payload.data.expected_delivery_time,
        carrierFee: payload.data.total_fee,
      };
    } else if (process.env.SHIPPING_API_URL && provider !== "LOCAL") {
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
