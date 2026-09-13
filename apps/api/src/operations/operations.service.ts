import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { verify } from "argon2";

@Injectable()
export class OperationsService {
  constructor(readonly db: PrismaService) {}
  requireRole(actor: any, roles: string[]) {
    if (!actor.roles?.some((r: string) => roles.includes(r)))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Bạn không có quyền thực hiện thao tác này",
      });
  }
  async sellerShop(userId: string) {
    const membership = await this.db.shopMember.findFirst({
      where: {
        userId,
        isActive: true,
        shop: { status: { in: ["ACTIVE", "PENDING"] } },
      },
      include: { shop: true },
    });
    if (!membership)
      throw new ForbiddenException({
        code: "SELLER_SHOP_REQUIRED",
        message: "Tài khoản chưa có gian hàng",
      });
    return membership.shop;
  }
  async applySeller(userId: string, body: any) {
    return this.db.sellerApplication.create({
      data: {
        applicantId: userId,
        status: "SUBMITTED",
        businessType:
          body.businessEntityType ?? body.businessType ?? "INDIVIDUAL",
        legalName: body.legalName ?? body.shopName ?? "Seller",
        taxCode: body.taxCode,
        submittedAt: new Date(),
      },
    });
  }
  async myApplication(userId: string) {
    return this.db.sellerApplication.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
    });
  }
  async reviewSeller(actor: any, id: string, body: any) {
    this.requireRole(actor, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const application = await this.db.sellerApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException();
    if (body.action === "APPROVE") {
      return this.db.$transaction(async (tx) => {
        const app = await tx.sellerApplication.update({
          where: { id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        });
        const role = await tx.role.upsert({
          where: { key: "SELLER_OWNER" },
          create: { key: "SELLER_OWNER" },
          update: {},
        });
        await tx.userRole.upsert({
          where: {
            userId_roleId: { userId: app.applicantId, roleId: role.id },
          },
          create: { userId: app.applicantId, roleId: role.id },
          update: {},
        });
        const existing = await tx.shop.findUnique({
          where: { sellerApplicationId: id },
        });
        if (!existing) {
          const shop = await tx.shop.create({
            data: {
              sellerApplicationId: id,
              name: app.legalName,
              slug: `${app.legalName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 6)}`,
              status: "ACTIVE",
            },
          });
          await tx.shopMember.create({
            data: { shopId: shop.id, userId: app.applicantId, role: "OWNER" },
          });
        }
        return app;
      });
    }
    return this.db.sellerApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: body.reason ?? "Rejected",
        reviewedAt: new Date(),
      },
    });
  }
  async createProduct(userId: string, body: any) {
    const shop = await this.sellerShop(userId);
    const type = body.productType ?? body.type ?? "PHYSICAL";
    const variants =
      body.variants ??
      (body.price != null
        ? [
            {
              name: "Default",
              sku: body.sku ?? `SKU-${randomUUID().slice(0, 8)}`,
              price: body.price,
              stock: body.stock ?? 0,
            },
          ]
        : []);
    const plans = body.plans ?? [];
    const prices = [
        ...variants.map((v: any) => Number(v.price ?? 0)),
        ...plans.map((v: any) => Number(v.price ?? 0)),
      ].filter((x) => Number.isSafeInteger(x) && x >= 0);
    const min = prices.length ? Math.min(...prices) : 0;
    return this.db.product.create({
      data: {
        shopId: shop.id,
        categoryId: body.categoryId || null,
        brandId: body.brandId || null,
        type,
        status: body.submitForReview ? "PENDING_REVIEW" : "DRAFT",
        slug:
          body.slug ??
          `${String(body.name ?? "product")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 6)}`,
        name: body.name ?? body.title ?? "Untitled product",
        description: body.description ?? "",
        minPriceAmount: BigInt(min),
        attributes: {
          ...(body.attributes ?? body.techSpecs ?? {}),
          _document: body,
        },
        variants:
          type === "PHYSICAL"
            ? {
                create: variants.map((v: any) => ({
                  sku: v.sku ?? `SKU-${randomUUID().slice(0, 8)}`,
                  name: v.name ?? "Default",
                  priceAmount: BigInt(v.price ?? 0),
                  compareAtAmount: v.originalPrice
                    ? BigInt(v.originalPrice)
                    : undefined,
                  stockOnHand: Number(v.stock ?? 0),
                })),
              }
            : undefined,
        appPlans:
          type === "DIGITAL_APP_ACCOUNT"
            ? {
                create: plans.map((p: any) => ({
                  sku: p.sku ?? `PLAN-${randomUUID().slice(0, 8)}`,
                  name: p.name,
                  priceAmount: BigInt(p.price ?? 0),
                  compareAtAmount: p.compareAtPrice
                    ? BigInt(p.compareAtPrice)
                    : undefined,
                  fulfillmentType: p.fulfillmentType,
                  serviceDurationValue:
                    p.serviceDuration?.value ?? p.duration?.value ?? 1,
                  serviceDurationUnit:
                    p.serviceDuration?.unit ?? p.duration?.unit ?? "MONTH",
                  warrantyDurationValue:
                    p.warrantyDuration?.value ?? p.warranty?.value ?? 0,
                  warrantyDurationUnit:
                    p.warrantyDuration?.unit ?? p.warranty?.unit ?? "MONTH",
                  buyerFieldSchema:
                    p.buyerFieldDefinitions ?? p.requiredBuyerFields ?? [],
                  deliveryEstimateMinutes: p.deliveryEstimateMinutes,
                  purchaseLimit: p.purchaseLimit,
                })),
              }
            : undefined,
      },
      include: { variants: true, appPlans: true },
    });
  }
  async sellerProducts(userId: string, type?: string) {
    const shop = await this.sellerShop(userId);
    return this.db.product.findMany({
      where: { shopId: shop.id, ...(type ? { type: type as any } : {}) },
      include: { variants: true, appPlans: true },
    });
  }
  async sellerOrders(userId: string, status?: string) {
    const shop = await this.sellerShop(userId);
    return this.db.order.findMany({
      where: {
        shopId: shop.id,
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: { items: { include: { snapshot: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
  async reviewProduct(actor: any, id: string, body: any) {
    this.requireRole(actor, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const status =
      body.action === "APPROVE"
        ? "ACTIVE"
        : body.action === "HIDE"
          ? "HIDDEN"
          : "REJECTED";
    return this.db.product.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: actor.id,
        ...(status === "ACTIVE" ? { publishedAt: new Date() } : {}),
      },
    });
  }
  private key() {
    const source =
      process.env.CREDENTIAL_MASTER_KEY ??
      process.env.JWT_REFRESH_SECRET ??
      "local-credential-key-change-me";
    return createHash("sha256").update(source).digest();
  }
  private encrypt(value: unknown) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), nonce);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    return { encrypted, nonce, tag: cipher.getAuthTag() };
  }
  private decrypt(item: any) {
    if (!item.encryptedPayload || !item.payloadNonce || !item.payloadAuthTag)
      return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key(),
      item.payloadNonce,
    );
    decipher.setAuthTag(item.payloadAuthTag);
    return JSON.parse(
      Buffer.concat([
        decipher.update(item.encryptedPayload),
        decipher.final(),
      ]).toString("utf8"),
    );
  }
  async addInventory(userId: string, body: any) {
    const shop = await this.sellerShop(userId);
    const product = await this.db.product.findFirst({
      where: { id: body.productId, shopId: shop.id },
    });
    if (!product) throw new NotFoundException();
    const payload =
      body.credentials ??
      (body.licenseKey ? { licenseKey: body.licenseKey } : {});
    const encrypted = this.encrypt(payload);
    const masked = String(payload.login ?? payload.licenseKey ?? "").replace(
      /^(.{2}).*(.{2})$/,
      "$1***$2",
    );
    return this.db.inventoryItem.create({
      data: {
        productId: product.id,
        appPlanId: body.planId || null,
        type:
          body.itemType === "LICENSE_KEY" || body.licenseKey
            ? "LICENSE_KEY"
            : product.type === "DIGITAL_GAME_ACCOUNT"
              ? "GAME_CREDENTIAL"
              : "APP_CREDENTIAL",
        status: "AVAILABLE",
        internalCode: body.internalCode ?? `INV-${randomUUID().slice(0, 8)}`,
        maskedIdentifier: masked,
        encryptedPayload: encrypted.encrypted,
        payloadNonce: encrypted.nonce,
        payloadAuthTag: encrypted.tag,
        payloadKeyVersion: 1,
      },
    });
  }
  async inventory(userId: string, query: any, productType?: string) {
    const shop = await this.sellerShop(userId);
    const rows = await this.db.inventoryItem.findMany({
      where: {
        product: {
          shopId: shop.id,
          ...(productType ? { type: productType as any } : {}),
        },
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.planId ? { appPlanId: query.planId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: { product: true, appPlan: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((x) => ({
      id: x.id,
      productId: x.productId,
      productName: x.product.name,
      planId: x.appPlanId,
      planName: x.appPlan?.name,
      internalCode: x.internalCode,
      maskedLogin: x.maskedIdentifier,
      maskedIdentifier: x.maskedIdentifier,
      status: x.status,
      addedAt: x.createdAt.toISOString(),
      updatedAt: x.updatedAt.toISOString(),
      reservedUntil: x.reservedUntil?.toISOString(),
    }));
  }
  async inventoryStatus(userId: string, id: string, enabled: boolean) {
    const shop = await this.sellerShop(userId);
    const item = await this.db.inventoryItem.findFirst({
      where: { id, product: { shopId: shop.id } },
    });
    if (!item) throw new NotFoundException();
    return this.db.inventoryItem.update({
      where: { id },
      data: { status: enabled ? "AVAILABLE" : "DISABLED" },
    });
  }
  async delivery(
    userId: string,
    orderItemId: string,
    reveal = false,
    authPass?: string,
  ) {
    const item = await this.db.orderItem.findFirst({
      where: {
        id: orderItemId,
        order: {
          group: { buyerId: userId },
          status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
        },
      },
      include: { soldInventory: true, deliveries: true, warranty: true },
    });
    if (!item) throw new NotFoundException();
    let delivery = item.deliveries[0];
    if (!delivery)
      delivery = await this.db.digitalDelivery.create({
        data: {
          orderItemId: item.id,
          inventoryItemId: item.soldInventory[0]?.id,
          status: "READY",
          readyAt: new Date(),
        },
      });
    if (!reveal)
      return {
        orderId: item.orderId,
        orderItemId: item.id,
        deliveryStatus: delivery.status,
        itemCount: item.soldInventory.length,
        revealedAt: delivery.revealedAt?.toISOString(),
        warrantyEndsAt: item.warranty?.endsAt.toISOString(),
        instructions: ["Không chia sẻ credential với người khác"],
        requiresReauthentication: true,
      };
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || !authPass || !(await verify(user.passwordHash, authPass)))
      throw new ForbiddenException({
        code: "REAUTHENTICATION_REQUIRED",
        message: "Vui lòng nhập lại mật khẩu để xem thông tin giao hàng",
      });
    const credentials = item.soldInventory.map((x) => this.decrypt(x));
    await this.db.$transaction([
      this.db.digitalDelivery.updateMany({
        where: { orderItemId },
        data: {
          status: "REVEALED",
          revealedAt: new Date(),
          revealCount: { increment: 1 },
        },
      }),
      this.db.auditLog.create({
        data: {
          actorUserId: userId,
          action: "DIGITAL_CREDENTIAL_REVEAL",
          targetType: "ORDER_ITEM",
          targetId: orderItemId,
          requestId: randomUUID(),
        },
      }),
    ]);
    return {
      deliveryId: delivery.id,
      orderId: item.orderId,
      orderItemId,
      revealedAt: new Date().toISOString(),
      credentials,
      content: credentials[0],
    };
  }
  async resolveDigitalItem(userId: string, orderOrItemId: string) {
    const item = await this.db.orderItem.findFirst({
      where: {
        OR: [
          { id: orderOrItemId },
          { orderId: orderOrItemId },
          { order: { orderGroupId: orderOrItemId } },
        ],
        order: { group: { buyerId: userId } },
        productType: { not: "PHYSICAL" },
      },
    });
    if (!item) throw new NotFoundException();
    return item.id;
  }

  async createDigitalDispute(userId: string, body: any) {
    const order = await this.db.order.findFirst({
      where: {
        id: body.orderId,
        group: { buyerId: userId },
        items: { some: { productType: { not: "PHYSICAL" } } },
      },
      include: { items: true },
    });
    if (!order) throw new NotFoundException();
    const open = await this.db.dispute.findFirst({ where: { orderId: order.id, status: { in: ["OPEN", "SELLER_RESPONSE_PENDING", "ADMIN_REVIEW"] } } });
    if (open) throw new ConflictException({ code: "DISPUTE_ALREADY_OPEN", message: "Đơn hàng đã có khiếu nại đang xử lý" });
    const dispute = await this.db.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          orderId: order.id,
          openedByUserId: userId,
          issueType: String(body.issueType ?? "OTHER"),
          description: String(body.description ?? ""),
          desiredSolution: String(body.desiredResolution ?? body.desiredSolution ?? "REPLACE"),
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "DISPUTED" } });
      await tx.digitalDelivery.updateMany({ where: { orderItemId: { in: order.items.map((x) => x.id) } }, data: { status: "REPORTED" } });
      return created;
    });
    return this.disputeDto(dispute);
  }

  async confirmDigitalDelivery(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId, group: { buyerId: userId }, items: { some: { productType: { not: "PHYSICAL" } } } },
      include: { items: true },
    });
    if (!order) throw new NotFoundException();
    await this.db.$transaction([
      this.db.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } }),
      this.db.digitalDelivery.updateMany({
        where: { orderItemId: { in: order.items.map((item) => item.id) }, status: { in: ["READY", "REVEALED"] } },
        data: { deliveredAt: new Date() },
      }),
    ]);
    return { success: true, completedAt: new Date().toISOString() };
  }

  async disputesFor(userId: string, roles: string[]) {
    const admin = roles.some((role) => ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role));
    const rows = await this.db.dispute.findMany({
      where: admin
        ? {}
        : {
            OR: [
              { openedByUserId: userId },
              { order: { shop: { members: { some: { userId } } } } },
            ],
          },
      include: { order: { include: { group: { include: { buyer: true } }, shop: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.disputeDto(row));
  }

  async disputeById(userId: string, roles: string[], id: string) {
    return (await this.disputesFor(userId, roles)).find((row: any) => row.id === id) ?? null;
  }

  async respondDispute(userId: string, id: string, message: string) {
    const shop = await this.sellerShop(userId);
    const dispute = await this.db.dispute.findFirst({ where: { id, order: { shopId: shop.id } } });
    if (!dispute) throw new NotFoundException();
    return this.disputeDto(await this.db.dispute.update({
      where: { id },
      data: { status: "ADMIN_REVIEW", resolutionNotes: String(message).slice(0, 5000) },
    }));
  }

  async resolveDispute(actor: any, id: string, body: any) {
    this.requireRole(actor, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const statusByResolution: Record<string, any> = {
      REFUND: "RESOLVED_REFUNDED",
      REPLACE: "RESOLVED_REPLACED",
      DISMISS: "DISMISSED",
    };
    const status = statusByResolution[String(body.resolution).toUpperCase()];
    if (!status) throw new BadRequestException({ code: "INVALID_RESOLUTION", message: "Hướng xử lý không hợp lệ" });
    const dispute = await this.db.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id },
        data: { status, resolutionNotes: body.notes, resolvedBy: actor.id, resolvedAt: new Date() },
        include: { order: true },
      });
      if (status === "RESOLVED_REFUNDED") {
        await tx.order.update({ where: { id: updated.orderId }, data: { status: "REFUNDED" } });
        await tx.paymentIntent.updateMany({ where: { orderGroupId: updated.order.orderGroupId, status: "PAID" }, data: { status: "REFUNDED" } });
        let changed = await tx.$executeRaw`UPDATE wallets SET pending_amount = pending_amount - ${updated.order.totalAmount}, version = version + 1, updated_at = now() WHERE shop_id = ${updated.order.shopId}::uuid AND currency = 'VND' AND pending_amount >= ${updated.order.totalAmount}`;
        let source = `SELLER_PENDING:${updated.order.shopId}`;
        if (changed !== 1) {
          changed = await tx.$executeRaw`UPDATE wallets SET available_amount = available_amount - ${updated.order.totalAmount}, version = version + 1, updated_at = now() WHERE shop_id = ${updated.order.shopId}::uuid AND currency = 'VND' AND available_amount >= ${updated.order.totalAmount}`;
          source = `SELLER_AVAILABLE:${updated.order.shopId}`;
        }
        if (changed !== 1)
          throw new ConflictException({ code: "REFUND_BALANCE_UNAVAILABLE", message: "Không đủ số dư để hoàn tiền tự động" });
        await tx.ledgerTransaction.create({
          data: {
            referenceType: "REFUND",
            referenceId: updated.id,
            idempotencyKey: `refund:dispute:${updated.id}`,
            description: `Refund dispute ${updated.id}`,
            status: "POSTED",
            postedAt: new Date(),
            entries: { create: [
              { accountCode: source, direction: "DEBIT", amount: updated.order.totalAmount },
              { accountCode: "CUSTOMER_REFUND_PAYABLE", direction: "CREDIT", amount: updated.order.totalAmount },
            ] },
          },
        });
      }
      return updated;
    });
    return this.disputeDto(dispute);
  }

  private disputeDto(row: any) {
    return {
      id: row.id,
      orderId: row.orderId,
      orderCode: row.order?.code,
      buyerId: row.openedByUserId,
      buyerName: row.order?.group?.buyer?.fullName,
      shopId: row.order?.shopId,
      shopName: row.order?.shop?.name,
      issueType: row.issueType,
      description: row.description,
      desiredResolution: row.desiredSolution,
      status: row.status,
      sellerResponse: row.status === "ADMIN_REVIEW" ? row.resolutionNotes : undefined,
      resolutionNotes: row.resolvedAt ? row.resolutionNotes : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createWarrantyClaim(userId: string, body: any) {
    const warranty = await this.db.warranty.findFirst({
      where: {
        OR: [{ id: body.warrantyId }, { orderItemId: body.orderItemId }],
        status: "ACTIVE",
        endsAt: { gt: new Date() },
        orderItem: { order: { group: { buyerId: userId } } },
      },
    });
    if (!warranty) throw new NotFoundException();
    return this.db.warrantyClaim.create({
      data: {
        warrantyId: warranty.id,
        userId,
        issue: String(body.issueType ?? body.issue ?? "OTHER"),
        description: String(body.issueDescription ?? body.description ?? ""),
        evidence: body.evidenceImages ?? [],
      },
    });
  }

  async createReturn(userId: string, body: any) {
    const order = await this.db.order.findFirst({
      where: { id: body.orderId, group: { buyerId: userId }, status: { in: ["DELIVERED", "COMPLETED"] } },
      include: { items: true, shop: true },
    });
    if (!order) throw new NotFoundException();
    if (Date.now() - order.updatedAt.getTime() > Number(process.env.RETURN_WINDOW_DAYS ?? 7) * 86400000)
      throw new ConflictException({ code: "RETURN_WINDOW_EXPIRED", message: "Đơn hàng đã quá thời hạn đổi trả" });
    const itemIds = body.orderItemIds ?? (body.orderItemId ? [body.orderItemId] : undefined) ?? body.items?.map((item: any) => item.orderItemId) ?? order.items.map((item) => item.id);
    const selected = order.items.filter((item) => itemIds.includes(item.id));
    if (!selected.length) throw new BadRequestException({ code: "RETURN_ITEMS_REQUIRED", message: "Cần chọn sản phẩm trả lại" });
    const amount = selected.reduce((sum, item) => sum + item.totalAmount, 0n);
    const created = await this.db.$transaction(async (tx) => {
      const row = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          buyerId: userId,
          itemIds,
          reason: String(body.reason ?? "OTHER"),
          description: String(body.description ?? ""),
          evidenceImages: body.evidenceImages ?? [],
          requestedRefundAmount: amount,
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "RETURN_REQUESTED" } });
      return row;
    });
    return { ...created, orderCode: order.code, shopId: order.shopId, requestedRefundAmount: Number(created.requestedRefundAmount) };
  }

  async toggleShopEngagement(userId: string, shopId: string, type: "FOLLOW" | "LIKE", active: boolean) {
    const shop = await this.db.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException();
    const key = { shopId_userId_type: { shopId, userId, type } };
    if (active)
      await this.db.shopEngagement.upsert({
        where: key,
        create: { shopId, userId, type },
        update: {},
      });
    else await this.db.shopEngagement.deleteMany({ where: { shopId, userId, type } });
    const count = await this.db.shopEngagement.count({ where: { shopId, type } });
    return type === "FOLLOW"
      ? { followerCount: count, isFollowing: active }
      : { likeCount: count, isLiked: active };
  }

  async shopReviews(shopId: string, productId?: string) {
    const rows = await this.db.shopReview.findMany({
      where: { shopId, ...(productId ? { productId } : {}) },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      shopId: row.shopId,
      productId: row.productId,
      orderId: row.orderId,
      userId: row.userId,
      userName: row.user.fullName,
      rating: row.rating,
      comment: row.comment,
      images: row.images,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createShopReview(userId: string, shopId: string, body: any) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new BadRequestException({ code: "INVALID_RATING", message: "Điểm đánh giá phải từ 1 đến 5" });
    const order = await this.db.order.findFirst({
      where: {
        id: body.orderId,
        shopId,
        group: { buyerId: userId },
        status: "COMPLETED",
        ...(body.productId ? { items: { some: { productId: body.productId } } } : {}),
      },
    });
    if (!order) throw new ForbiddenException({ code: "PURCHASE_REQUIRED", message: "Chỉ người đã mua hàng mới được đánh giá" });
    const created = await this.db.$transaction(async (tx) => {
      const row = await tx.shopReview.create({
        data: {
          shopId,
          userId,
          productId: body.productId || null,
          orderId: order.id,
          rating,
          comment: String(body.comment ?? "").slice(0, 3000),
          images: body.images ?? [],
        },
      });
      const aggregate = await tx.shopReview.aggregate({ where: { shopId }, _avg: { rating: true }, _count: true });
      await tx.shop.update({
        where: { id: shopId },
        data: { ratingAverage: aggregate._avg.rating ?? 0, ratingCount: aggregate._count },
      });
      return row;
    });
    return created;
  }

  async sellerFinance(userId: string) {
    const shop = await this.sellerShop(userId);
    const [wallet, gross, refunded, paidOut] = await Promise.all([
      this.db.wallet.findFirst({ where: { shopId: shop.id, currency: "VND" } }),
      this.db.order.aggregate({ where: { shopId: shop.id, status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPING", "DELIVERED", "COMPLETED"] } }, _sum: { totalAmount: true } }),
      this.db.order.aggregate({ where: { shopId: shop.id, status: "REFUNDED" }, _sum: { totalAmount: true } }),
      this.db.payoutRequest.aggregate({ where: { shopId: shop.id, status: "COMPLETED" }, _sum: { amount: true } }),
    ]);
    return {
      grossSales: Number(gross._sum.totalAmount ?? 0),
      platformFee: 0,
      voucherDeduction: 0,
      refundDeduction: Number(refunded._sum.totalAmount ?? 0),
      availableBalance: Number(wallet?.availableAmount ?? 0),
      pendingBalance: Number(wallet?.pendingAmount ?? 0),
      totalPaidOut: Number(paidOut._sum.amount ?? 0),
    };
  }

  async requestPayout(userId: string, body: any) {
    const shop = await this.sellerShop(userId);
    const amountNumber = Number(body.amount);
    if (!Number.isSafeInteger(amountNumber) || amountNumber < Number(process.env.MIN_PAYOUT_AMOUNT ?? 50000))
      throw new BadRequestException({ code: "INVALID_PAYOUT_AMOUNT", message: "Số tiền rút không hợp lệ" });
    const amount = BigInt(amountNumber);
    return this.db.$transaction(async (tx) => {
      const changed = await tx.$executeRaw`UPDATE wallets SET available_amount = available_amount - ${amount}, version = version + 1, updated_at = now() WHERE shop_id = ${shop.id}::uuid AND currency = 'VND' AND available_amount >= ${amount}`;
      if (changed !== 1)
        throw new ConflictException({ code: "INSUFFICIENT_BALANCE", message: "Số dư khả dụng không đủ" });
      const payout = await tx.payoutRequest.create({
        data: { shopId: shop.id, amount, bankInfo: body.bankInfo ?? {} },
      });
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "PAYOUT",
          referenceId: payout.id,
          idempotencyKey: `payout:${payout.id}`,
          description: `Payout request ${payout.id}`,
          status: "POSTED",
          postedAt: new Date(),
          entries: { create: [
            { accountCode: `SELLER_AVAILABLE:${shop.id}`, direction: "DEBIT", amount },
            { accountCode: "PAYOUT_PAYABLE", direction: "CREDIT", amount },
          ] },
        },
      });
      return { ...payout, amount: amountNumber };
    });
  }
  async docs(kind: string, where: any = {}) {
    return (
      await this.db.resourceDocument.findMany({
        where: { kind, ...where },
        orderBy: { createdAt: "desc" },
      })
    ).map((x) => ({
      ...(x.document as any),
      id: x.id,
      status: x.status,
      createdAt: x.createdAt.toISOString(),
    }));
  }
  async createDoc(kind: string, body: any, ownerId?: string, shopId?: string) {
    const slug = body.slug ? String(body.slug) : null;
    const row = await this.db.resourceDocument.create({
      data: {
        kind,
        ownerId,
        shopId,
        slug,
        status: body.status ?? "PENDING",
        document: body,
      },
    });
    return {
      ...body,
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
  async upsertCatalog(kind: string, body: any) {
    const slug =
      body.slug ??
      String(body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    const row = await this.db.resourceDocument.upsert({
      where: { kind_slug: { kind, slug } },
      create: { kind, slug, status: "ACTIVE", document: body },
      update: { document: body, status: "ACTIVE" },
    });
    return { ...body, id: row.id, slug };
  }
}
