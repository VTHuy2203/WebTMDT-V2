import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { allowedOrderActions } from "../common/helpers";
import { PrismaService } from "../prisma.service";
import { ShippingService } from "../platform/shipping.service";
import { CatalogCacheService } from "../catalog/catalog-cache.service";

@Injectable()
export class CommerceService {
  constructor(
    private readonly db: PrismaService,
    @Optional() private readonly shipping?: ShippingService,
    @Optional() private readonly catalogCache?: CatalogCacheService,
  ) {}
  private money(v: bigint | number) {
    return Number(v);
  }
  private async activeCart(userId: string, tx: any = this.db) {
    return tx.cart.upsert({
      where: {
        id:
          (await tx.cart.findFirst({ where: { userId, status: "ACTIVE" } }))
            ?.id ?? randomUUID(),
      },
      create: { userId },
      update: {},
    });
  }
  private cartLine(x: any) {
    const option = x.productVariant ?? x.appPlan;
    const unitPrice = Number(
      option?.priceAmount ?? x.product.minPriceAmount ?? 0,
    );
    const available = x.productType === "PHYSICAL"
      ? Math.max(0, (x.productVariant?.stockOnHand ?? 0) - (x.productVariant?.stockReserved ?? 0))
      : 99;
    return {
      id: x.id,
      productId: x.productId,
      variantId: x.productVariantId,
      appPlanId: x.appPlanId,
      productType: x.productType,
      quantity: x.quantity,
      selected: x.selected,
      name: x.product.name,
      productName: x.product.name,
      productSlug: x.product.slug,
      variantName: option?.name ?? "Mặc định",
      price: unitPrice,
      originalPrice: option?.compareAtAmount == null ? undefined : Number(option.compareAtAmount),
      stock: available,
      availability: available > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      shippingRequired: x.productType === "PHYSICAL",
      unitPrice,
      subtotal: unitPrice * x.quantity,
      shopId: x.product.shopId,
      shopName: x.product.shop.name,
      image:
        ((x.product.attributes as any)?._document?.images ?? [])[0]?.url ?? "",
      thumbnail:
        ((x.product.attributes as any)?._document?.images ?? [])[0]?.url ?? "",
    };
  }
  async cart(userId: string) {
    const cart = await this.activeCart(userId);
    const rows = await this.db.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: { include: { shop: true, physicalDetail: true } },
        productVariant: true,
        appPlan: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const grouped = new Map<string, any>();
    for (const row of rows) {
      const item = this.cartLine(row);
      const current = grouped.get(item.shopId) ?? {
        shopId: item.shopId,
        shopName: item.shopName,
        items: [],
        subtotal: 0,
      };
      current.items.push(item);
      current.subtotal += item.subtotal;
      grouped.set(item.shopId, current);
    }
    return [...grouped.values()];
  }
  async addCart(userId: string, body: any) {
    const product = await this.db.product.findUnique({
      where: { id: body.productId },
      include: { variants: true, appPlans: true },
    });
    if (!product || product.status !== "ACTIVE")
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Không tìm thấy sản phẩm",
      });
    const cart = await this.activeCart(userId);
    const requestedQuantity = Number(body.quantity ?? 1);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 99)
      throw new BadRequestException({ code: "INVALID_QUANTITY", message: "Số lượng phải từ 1 đến 99" });
    const quantity = requestedQuantity;
    const variantId = body.productVariantId ?? body.variantId;
    const planId =
      body.appPlanId ??
      (product.type === "DIGITAL_APP_ACCOUNT" ? body.variantId : undefined);
    if (
      product.type === "PHYSICAL" &&
      !product.variants.some((x) => x.id === variantId)
    )
      throw new BadRequestException({
        code: "INVALID_VARIANT",
        message: "Biến thể không hợp lệ",
      });
    if (
      product.type === "DIGITAL_APP_ACCOUNT" &&
      !product.appPlans.some((x) => x.id === planId)
    )
      throw new BadRequestException({
        code: "INVALID_PLAN",
        message: "Gói ứng dụng không hợp lệ",
      });
    await this.db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        productType: product.type,
        productVariantId: variantId || null,
        appPlanId: planId || null,
        quantity,
        buyerFields: body.buyerProvidedValues ?? undefined,
      },
    });
    return this.cart(userId);
  }
  async updateCart(userId: string, id: string, body: any) {
    const item = await this.ownedCartItem(userId, id);
    await this.db.cartItem.update({
      where: { id: item.id },
      data: {
        ...(body.quantity != null
          ? { quantity: this.validQuantity(body.quantity) }
          : {}),
        ...(body.selected != null ? { selected: Boolean(body.selected) } : {}),
      },
    });
    return this.cart(userId);
  }
  async toggle(userId: string, id: string) {
    const item = await this.ownedCartItem(userId, id);
    await this.db.cartItem.update({
      where: { id },
      data: { selected: !item.selected },
    });
    return this.cart(userId);
  }
  async selectAll(userId: string, selected: boolean) {
    const cart = await this.activeCart(userId);
    await this.db.cartItem.updateMany({
      where: { cartId: cart.id },
      data: { selected },
    });
    return this.cart(userId);
  }
  async removeCart(userId: string, id: string) {
    const item = await this.ownedCartItem(userId, id);
    await this.db.cartItem.delete({ where: { id: item.id } });
    return this.cart(userId);
  }
  private async ownedCartItem(userId: string, id: string) {
    const item = await this.db.cartItem.findFirst({
      where: { id, cart: { userId, status: "ACTIVE" } },
    });
    if (!item) throw new NotFoundException();
    return item;
  }

  private validQuantity(value: unknown) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
      throw new BadRequestException({ code: "INVALID_QUANTITY", message: "Số lượng phải từ 1 đến 99" });
    return quantity;
  }

  async preview(userId: string, body: any) {
    const ids: string[] = body.selectedCartItemIds ?? [];
    if (!ids.length)
      throw new BadRequestException({
        code: "EMPTY_CHECKOUT",
        message: "Chưa chọn sản phẩm",
      });
    const rows = await this.db.cartItem.findMany({
      where: {
        id: { in: ids },
        cart: { userId },
        product: { status: "ACTIVE" },
      },
      include: {
        product: { include: { shop: true, physicalDetail: true } },
        productVariant: true,
        appPlan: true,
      },
    });
    if (rows.length !== ids.length)
      throw new ConflictException({
        code: "CART_CHANGED",
        message: "Giỏ hàng đã thay đổi",
      });
    let subtotal = 0;
    const groups = new Map<string, any>();
    for (const row of rows) {
      const line = this.cartLine(row);
      subtotal += line.subtotal;
      const g = groups.get(line.shopId) ?? {
        shopId: line.shopId,
        shopName: line.shopName,
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        total: 0,
        items: [],
        shippingItems: [],
      };
      g.items.push(line);
      g.subtotal += line.subtotal;
      if (row.productType === "PHYSICAL")
        g.shippingItems.push({
          quantity: row.quantity,
          weightGrams: row.product.physicalDetail?.weightGrams,
        });
      groups.set(line.shopId, g);
    }
    for (const group of groups.values()) {
      if (group.shippingItems.length) {
        if (this.shipping) {
          const quote = await this.shipping.quote({
              destination: body.shippingAddress ?? {},
              items: group.shippingItems,
              orderValue: group.subtotal,
              serviceId: body.shippingMethodId,
            });
          group.shippingFee = quote.fee;
          group.shippingProvider = quote.provider;
          group.shippingServiceId = quote.serviceId;
        } else {
          group.shippingFee = Number(process.env.LOCAL_SHIPPING_FEE ?? 30000);
        }
      }
      delete group.shippingItems;
      group.total = group.subtotal + group.shippingFee;
    }
    const shippingFee = [...groups.values()].reduce(
      (s, g) => s + g.shippingFee,
      0,
    );
    const finalTotal = subtotal + shippingFee;
    const snapshot = {
      selectedCartItemIds: ids,
      addressId: body.addressId,
      shippingAddress: body.shippingAddress,
      shippingMethodId: body.shippingMethodId,
      voucherCodes: body.voucherCodes ?? [],
      subtotal,
      shippingFee,
      platformDiscount: 0,
      sellerDiscount: 0,
      totalVoucherDiscount: 0,
      tax: 0,
      finalTotal,
      total: finalTotal,
      shopBreakdown: [...groups.values()],
    };
    const expiresAt = new Date(Date.now() + 10 * 60000);
    const snapshotHash = createHash("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex");
    const session = await this.db.checkoutSession.create({
      data: { userId, snapshot: snapshot as any, snapshotHash, expiresAt },
    });
    return {
      ...snapshot,
      checkoutSessionId: session.id,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async createOrder(userId: string, body: any, key: string) {
    if (!key || key.length < 8)
      throw new BadRequestException({
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Thiếu Idempotency-Key",
      });
    let checkoutId = body.checkoutSessionId as string | undefined;
    if (!checkoutId)
      checkoutId = (await this.preview(userId, body)).checkoutSessionId;
    const hashValue = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");
    const prior = await this.db.idempotencyRecord.findFirst({
      where: {
        actorId: userId,
        method: "POST",
        route: "/checkout/order-groups",
        key,
      },
    });
    if (prior) {
      if (prior.requestHash !== hashValue)
        throw new ConflictException({
          code: "IDEMPOTENCY_CONFLICT",
          message: "Idempotency-Key đã dùng với nội dung khác",
        });
      if (prior.responseBody) return prior.responseBody;
    }
    const result = await this.db.$transaction(
      async (tx) => {
        const checkout = await tx.checkoutSession.findFirst({
          where: { id: checkoutId, userId, consumedAt: null },
        });
        if (!checkout || checkout.expiresAt < new Date())
          throw new ConflictException({
            code: "CHECKOUT_EXPIRED",
            message: "Phiên checkout đã hết hạn",
          });
        const snap: any = checkout.snapshot;
        const rows = await tx.cartItem.findMany({
          where: { id: { in: snap.selectedCartItemIds }, cart: { userId } },
          include: { product: true, productVariant: true, appPlan: true },
        });
        if (rows.length !== snap.selectedCartItemIds.length)
          throw new ConflictException({
            code: "CART_CHANGED",
            message: "Giỏ hàng đã thay đổi",
          });
        const group = await tx.orderGroup.create({
          data: {
            buyerId: userId,
            code: `OG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            subtotalAmount: BigInt(snap.subtotal),
            shippingAmount: BigInt(snap.shippingFee),
            totalAmount: BigInt(snap.finalTotal),
          },
        });
        const orderIds: string[] = [];
        for (const shop of snap.shopBreakdown) {
          const order = await tx.order.create({
            data: {
              orderGroupId: group.id,
              shopId: shop.shopId,
              code: `OD${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
              subtotalAmount: BigInt(shop.subtotal),
              shippingAmount: BigInt(shop.shippingFee),
              totalAmount: BigInt(shop.total),
              shippingAddress: snap.addressId
                ? { addressId: snap.addressId, ...(snap.shippingAddress ?? {}) }
                : undefined,
            },
          });
          orderIds.push(order.id);
          for (const row of rows.filter(
            (x) => x.product.shopId === shop.shopId,
          )) {
            const option: any = row.productVariant ?? row.appPlan;
            const unit =
              option?.priceAmount ?? row.product.minPriceAmount ?? 0n;
            const item = await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: row.productId,
                productVariantId: row.productVariantId,
                appPlanId: row.appPlanId,
                productType: row.productType,
                quantity: row.quantity,
                unitPriceAmount: unit,
                totalAmount: unit * BigInt(row.quantity),
                snapshot: {
                  create: {
                    productName: row.product.name,
                    sku: option?.sku,
                    planName: row.appPlan?.name,
                    productType: row.productType,
                    fulfillmentType: row.appPlan?.fulfillmentType,
                    serviceDurationValue: row.appPlan?.serviceDurationValue,
                    serviceDurationUnit: row.appPlan?.serviceDurationUnit,
                    warrantyDurationValue: row.appPlan?.warrantyDurationValue,
                    warrantyDurationUnit: row.appPlan?.warrantyDurationUnit,
                    pricing: {
                      unitPrice: Number(unit),
                      quantity: row.quantity,
                    },
                    buyerFieldSchema: (row.appPlan?.buyerFieldSchema ??
                      []) as Prisma.InputJsonValue,
                    buyerProvidedValues: (row.buyerFields ??
                      {}) as Prisma.InputJsonValue,
                  },
                },
              },
            });
            if (row.productType === "PHYSICAL") {
              const changed =
                await tx.$executeRaw`UPDATE product_variants SET stock_reserved = stock_reserved + ${row.quantity}, version = version + 1 WHERE id = ${row.productVariantId}::uuid AND stock_on_hand - stock_reserved >= ${row.quantity}`;
              if (changed !== 1)
                throw new ConflictException({
                  code: "INVENTORY_OUT_OF_STOCK",
                  message: "Sản phẩm đã hết hàng",
                });
              await tx.inventoryReservation.create({
                data: {
                  productVariantId: row.productVariantId,
                  orderGroupId: group.id,
                  quantity: row.quantity,
                  expiresAt: new Date(Date.now() + 15 * 60000),
                  activeKey: "ACTIVE",
                },
              });
            } else {
              const inventory: Array<{ id: string }> =
                await tx.$queryRaw`SELECT id FROM inventory_items WHERE product_id = ${row.productId}::uuid AND status = 'AVAILABLE' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT ${row.quantity}`;
              if (inventory.length !== row.quantity)
                throw new ConflictException({
                  code: "INVENTORY_OUT_OF_STOCK",
                  message: "Sản phẩm số đã hết hàng",
                });
              for (const inv of inventory) {
                await tx.inventoryItem.update({
                  where: { id: inv.id },
                  data: {
                    status: "RESERVED",
                    reservedUntil: new Date(Date.now() + 15 * 60000),
                    soldOrderItemId: item.id,
                  },
                });
                await tx.inventoryReservation.create({
                  data: {
                    inventoryItemId: inv.id,
                    orderGroupId: group.id,
                    quantity: 1,
                    expiresAt: new Date(Date.now() + 15 * 60000),
                    activeKey: "ACTIVE",
                  },
                });
              }
            }
          }
        }
        const intent = await tx.paymentIntent.create({
          data: {
            orderGroupId: group.id,
            provider: body.paymentMethod === "COD" ? "COD" : "SEPAY",
            paymentCode: `MP${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
            status: "PENDING",
            amount: BigInt(snap.finalTotal),
            expiresAt: new Date(Date.now() + 15 * 60000),
          },
        });
        await tx.inventoryReservation.updateMany({
          where: { orderGroupId: group.id },
          data: { paymentIntentId: intent.id },
        });
        await tx.checkoutSession.update({
          where: { id: checkout.id },
          data: { consumedAt: new Date() },
        });
        await tx.cartItem.deleteMany({
          where: { id: { in: snap.selectedCartItemIds } },
        });
        const response = {
          orderGroupId: group.id,
          orderId: group.id,
          orderIds,
          paymentId: intent.id,
          totalAmount: snap.finalTotal,
        };
        await tx.idempotencyRecord.create({
          data: {
            actorId: userId,
            method: "POST",
            route: "/checkout/order-groups",
            key,
            requestHash: hashValue,
            statusCode: 201,
            responseBody: response,
            expiresAt: new Date(Date.now() + 86400000),
          },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateType: "ORDER_GROUP",
            aggregateId: group.id,
            eventType: "ORDER_GROUP_CREATED",
            payload: { orderGroupId: group.id },
          },
        });
        return response;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.catalogCache?.invalidate();
    return result;
  }

  async payment(userId: string, id: string) {
    const p = await this.db.paymentIntent.findFirst({
      where: { id, orderGroup: { buyerId: userId } },
    });
    if (!p) throw new NotFoundException();
    return {
      id: p.id,
      orderId: p.orderGroupId,
      orderGroupId: p.orderGroupId,
      amount: this.money(p.amount),
      method: p.provider === "COD" ? "COD" : "SEPAY_QR",
      status: p.status,
      paidAt: p.paidAt?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      expiresAt: p.expiresAt.toISOString(),
      sepayInfo: {
        qrUrl: `https://qr.sepay.vn/img?acc=${encodeURIComponent(process.env.SEPAY_ACCOUNT_NUMBER ?? "")}&bank=${encodeURIComponent(process.env.SEPAY_BANK_NAME ?? "")}&amount=${p.amount}&des=${p.paymentCode}`,
        paymentCode: p.paymentCode,
        bankName: process.env.SEPAY_BANK_NAME ?? "MBBank",
        accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? "",
        accountHolder:
          process.env.SEPAY_ACCOUNT_HOLDER ?? "MARKETPLACE VIETNAM",
        amount: this.money(p.amount),
        content: p.paymentCode,
        expiresAt: p.expiresAt.toISOString(),
      },
    };
  }
  async confirmPayment(id: string, externalId = `DEV-${randomUUID()}`) {
    return this.db.$transaction(async (tx) => {
      const p = await tx.paymentIntent.findUnique({ where: { id } });
      if (!p) throw new NotFoundException();
      if (p.status === "PAID") return p;
      await tx.paymentTransaction.upsert({
        where: {
          provider_externalTransactionId: {
            provider: p.provider,
            externalTransactionId: externalId,
          },
        },
        create: {
          paymentIntentId: p.id,
          provider: p.provider,
          externalTransactionId: externalId,
          amount: p.amount,
          occurredAt: new Date(),
        },
        update: {},
      });
      const paid = await tx.paymentIntent.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await tx.orderGroup.update({
        where: { id: p.orderGroupId },
        data: { status: "PAID" },
      });
      await tx.order.updateMany({
        where: { orderGroupId: p.orderGroupId },
        data: { status: "PAID" },
      });
      const physicalReservations = await tx.inventoryReservation.findMany({
        where: {
          orderGroupId: p.orderGroupId,
          status: "ACTIVE",
          productVariantId: { not: null },
        },
      });
      for (const reservation of physicalReservations) {
        await tx.$executeRaw`UPDATE product_variants SET stock_on_hand = stock_on_hand - ${reservation.quantity}, stock_reserved = stock_reserved - ${reservation.quantity}, version = version + 1 WHERE id = ${reservation.productVariantId}::uuid AND stock_reserved >= ${reservation.quantity}`;
      }
      await tx.inventoryItem.updateMany({
        where: {
          reservations: {
            some: { orderGroupId: p.orderGroupId, status: "ACTIVE" },
          },
        },
        data: { status: "SOLD", reservedUntil: null },
      });
      await tx.inventoryReservation.updateMany({
        where: { orderGroupId: p.orderGroupId, status: "ACTIVE" },
        data: { status: "CONSUMED", activeKey: null },
      });
      const orders = await tx.order.findMany({
        where: { orderGroupId: p.orderGroupId },
      });
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "PAYMENT",
          referenceId: p.id,
          idempotencyKey: `payment:${p.id}`,
          description: `Payment ${p.paymentCode}`,
          status: "POSTED",
          postedAt: new Date(),
          entries: {
            create: [
              {
                accountCode: "PAYMENT_CLEARING",
                direction: "DEBIT",
                amount: p.amount,
              },
              ...orders.map((order) => ({
                accountCode: `SELLER_PENDING:${order.shopId}`,
                direction: "CREDIT" as const,
                amount: order.totalAmount,
              })),
            ],
          },
        },
      });
      for (const order of orders) {
        await tx.wallet.upsert({
          where: {
            ownerType_ownerId_currency: {
              ownerType: "SHOP",
              ownerId: order.shopId,
              currency: "VND",
            },
          },
          create: {
            ownerType: "SHOP",
            ownerId: order.shopId,
            shopId: order.shopId,
            currency: "VND",
            pendingAmount: order.totalAmount,
          },
          update: {
            pendingAmount: { increment: order.totalAmount },
            version: { increment: 1 },
          },
        });
      }
      await tx.outboxEvent.create({
        data: {
          aggregateType: "PAYMENT_INTENT",
          aggregateId: p.id,
          eventType: "PAYMENT_CONFIRMED",
          payload: { paymentIntentId: p.id, orderGroupId: p.orderGroupId },
        },
      });
      return paid;
    });
  }

  async processWebhook(
    paymentCode: string,
    externalId: string,
    amount: bigint,
  ) {
    const intent = await this.db.paymentIntent.findUnique({
      where: { paymentCode },
    });
    if (!intent) return { accepted: true, matched: false };
    if (amount !== intent.amount || intent.expiresAt < new Date()) {
      const transaction = await this.db.paymentTransaction.upsert({
        where: {
          provider_externalTransactionId: {
            provider: "SEPAY",
            externalTransactionId: externalId,
          },
        },
        create: {
          paymentIntentId: intent.id,
          provider: "SEPAY",
          externalTransactionId: externalId,
          amount,
          occurredAt: new Date(),
        },
        update: {},
      });
      await this.db.paymentIntent.update({
        where: { id: intent.id },
        data: { status: "REVIEW_REQUIRED" },
      });
      await this.db.paymentReconciliation.upsert({
        where: { paymentTransactionId: transaction.id },
        create: {
          paymentIntentId: intent.id,
          paymentTransactionId: transaction.id,
          reasonCode:
            intent.expiresAt < new Date() ? "LATE_PAYMENT" : "AMOUNT_MISMATCH",
        },
        update: {},
      });
      return { accepted: true, matched: true, status: "REVIEW_REQUIRED" };
    }
    await this.confirmPayment(intent.id, externalId);
    return { accepted: true, matched: true, status: "PAID" };
  }
  async orders(userId: string, status?: string) {
    const rows = await this.db.order.findMany({
      where: {
        group: { buyerId: userId },
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: {
        shop: true,
        group: { include: { paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 } } },
        shipment: true,
        items: { include: { snapshot: true, product: true, productVariant: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((o) => this.orderDto(o));
  }
  async order(userId: string, id: string) {
    const o = await this.db.order.findFirst({
      where: { OR: [{ id }, { orderGroupId: id }], group: { buyerId: userId } },
      include: {
        shop: true,
        group: { include: { paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 } } },
        shipment: true,
        items: { include: { snapshot: true, product: true, productVariant: true } },
      },
    });
    if (!o) throw new NotFoundException();
    return this.orderDto(o);
  }
  private orderDto(o: any) {
    const payment = o.group?.paymentIntents?.[0];
    const address = o.shippingAddress ?? {};
    return {
      id: o.id,
      code: o.code,
      orderCode: o.code,
      shopId: o.shopId,
      shopName: o.shop.name,
      buyerId: o.group?.buyerId,
      shop: {
        id: o.shop.id,
        name: o.shop.name,
        slug: o.shop.slug,
        rating: Number(o.shop.ratingAverage ?? 0),
      },
      status: o.status,
      paymentStatus: payment?.status ?? (o.status === "PENDING_PAYMENT" ? "PENDING" : "PAID"),
      paymentMethod: payment?.provider === "COD" ? "COD" : "SEPAY_QR",
      subtotal: Number(o.subtotalAmount),
      shippingFee: Number(o.shippingAmount),
      discount: Number(o.discountAmount),
      total: Number(o.totalAmount),
      totalAmount: Number(o.totalAmount),
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      trackingCode: o.shipment?.trackingNumber,
      shippingAddress: {
        id: address.addressId ?? "",
        recipientName: address.recipientName ?? address.fullName ?? "",
        phoneNumber: address.phoneNumber ?? "",
        province: address.province ?? "",
        district: address.district ?? "",
        ward: address.ward ?? "",
        streetAddress: address.streetAddress ?? address.street ?? "",
        detail: address.detail,
        label: address.label ?? "HOME",
        isDefault: false,
      },
      shippingMethod: {
        id: "standard",
        code: "STANDARD",
        name: "Giao hàng tiêu chuẩn",
        carrier: o.shipment?.provider ?? "Marketplace Delivery",
        estimatedDeliveryDays: "2-5 ngày",
        fee: Number(o.shippingAmount),
      },
      items: o.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.snapshot?.productName,
        productSlug: i.product?.slug ?? "",
        variantId: i.productVariantId ?? i.appPlanId ?? "",
        variantName: i.productVariant?.name ?? i.snapshot?.planName ?? "Mặc định",
        thumbnail: (i.product?.attributes as any)?.images?.[0] ?? "",
        quantity: i.quantity,
        price: Number(i.unitPriceAmount),
        total: Number(i.totalAmount),
        productType: i.productType,
      })),
      allowedActions: allowedOrderActions(o.status),
      timeline: [
        {
          status: o.status,
          title: `Trạng thái: ${o.status}`,
          description: o.shipment?.trackingNumber ? `Mã vận đơn ${o.shipment.trackingNumber}` : "Đơn hàng đã được cập nhật",
          timestamp: o.updatedAt.toISOString(),
        },
      ],
    };
  }

  async digitalOrders(userId: string) {
    const rows = await this.db.order.findMany({
      where: { group: { buyerId: userId }, items: { some: { productType: { not: "PHYSICAL" } } } },
      include: {
        group: { include: { paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 } } },
        items: {
          where: { productType: { not: "PHYSICAL" } },
          include: { snapshot: true, product: true, deliveries: true },
        },
        disputes: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((order) => this.digitalOrderDto(order));
  }

  async sellerOrders(userId: string, status?: string) {
    const rows = await this.db.order.findMany({
      where: {
        shop: { members: { some: { userId } } },
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: {
        shop: true,
        group: { include: { paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 } } },
        shipment: true,
        items: { include: { snapshot: true, product: true, productVariant: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((order) => this.orderDto(order));
  }

  async sellerDigitalOrders(userId: string, appOnly = false) {
    const rows = await this.db.order.findMany({
      where: {
        shop: { members: { some: { userId } } },
        items: { some: { productType: appOnly ? "DIGITAL_APP_ACCOUNT" : { not: "PHYSICAL" } } },
      },
      include: {
        group: {
          include: {
            buyer: true,
            paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        items: {
          where: { productType: appOnly ? "DIGITAL_APP_ACCOUNT" : { not: "PHYSICAL" } },
          include: { snapshot: true, product: true, deliveries: true },
        },
        disputes: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((order) => ({
      ...this.digitalOrderDto(order),
      buyerName: order.group.buyer.fullName,
    }));
  }

  async adminOrders() {
    const rows = await this.db.order.findMany({
      include: {
        shop: true,
        group: { include: { paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 } } },
        shipment: true,
        items: { include: { snapshot: true, product: true, productVariant: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((order) => this.orderDto(order));
  }

  private digitalOrderDto(order: any) {
      const item: any = order.items[0];
      const delivery = item?.deliveries?.[0];
      const payment = order.group.paymentIntents[0];
      const ready = ["READY", "REVEALED"].includes(delivery?.status);
      return {
        id: order.id,
        code: order.code,
        productName: item?.snapshot?.productName ?? "Sản phẩm số",
        productThumbnail: (item?.product?.attributes as any)?.images?.[0] ?? "",
        productType: item?.productType,
        gameName: (item?.product?.attributes as any)?.gameName,
        planName: item?.snapshot?.planName,
        fulfillmentType: item?.snapshot?.fulfillmentType,
        quantity: item?.quantity ?? 0,
        total: Number(order.totalAmount),
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        paymentStatus: payment?.status ?? "PENDING",
        orderStatus: order.status,
        deliveryStatus: delivery?.status ?? (order.status === "PAID" ? "PREPARING" : "NOT_AVAILABLE"),
        disputeStatus: order.disputes[0]?.status,
        createdAt: order.createdAt.toISOString(),
        allowedActions: {
          viewDetail: true,
          pay: order.status === "PENDING_PAYMENT",
          cancel: order.status === "PENDING_PAYMENT",
          revealDelivery: ready,
          confirmReceived: delivery?.status === "REVEALED",
          reportIssue: ready,
          review: order.status === "COMPLETED",
        },
      };
  }
  async cancel(userId: string, id: string) {
    const order = await this.db.order.findFirst({
      where: { id, group: { buyerId: userId } },
    });
    if (!order) throw new NotFoundException();
    if (order.status !== "PENDING_PAYMENT")
      throw new ConflictException({
        code: "ORDER_STATE_INVALID",
        message: "Không thể hủy đơn ở trạng thái hiện tại",
      });
    await this.db.$transaction(async (tx) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderGroupId: order.orderGroupId, status: "ACTIVE" },
      });
      for (const reservation of reservations.filter(
        (x) => x.productVariantId,
      )) {
        await tx.productVariant.update({
          where: { id: reservation.productVariantId! },
          data: {
            stockReserved: { decrement: reservation.quantity },
            version: { increment: 1 },
          },
        });
      }
      await tx.inventoryItem.updateMany({
        where: {
          reservations: {
            some: { orderGroupId: order.orderGroupId, status: "ACTIVE" },
          },
        },
        data: {
          status: "AVAILABLE",
          reservedUntil: null,
          soldOrderItemId: null,
        },
      });
      await tx.inventoryReservation.updateMany({
        where: { orderGroupId: order.orderGroupId, status: "ACTIVE" },
        data: { status: "RELEASED", activeKey: null, releasedAt: new Date() },
      });
      await tx.order.updateMany({
        where: { orderGroupId: order.orderGroupId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      await tx.orderGroup.update({
        where: { id: order.orderGroupId },
        data: { status: "CANCELLED" },
      });
      await tx.paymentIntent.updateMany({
        where: { orderGroupId: order.orderGroupId, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
    });
    await this.catalogCache?.invalidate();
    return this.order(userId, id);
  }

  async confirmReceived(userId: string, id: string) {
    const order = await this.db.order.findFirst({
      where: { id, group: { buyerId: userId } },
    });
    if (!order) throw new NotFoundException();
    if (order.status === "COMPLETED") return this.order(userId, id);
    if (order.status !== "DELIVERED")
      throw new ConflictException({ code: "ORDER_STATE_INVALID", message: "Đơn hàng chưa ở trạng thái đã giao" });
    await this.db.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: "COMPLETED" } });
      const changed = await tx.$executeRaw`UPDATE wallets SET pending_amount = pending_amount - ${order.totalAmount}, available_amount = available_amount + ${order.totalAmount}, version = version + 1, updated_at = now() WHERE shop_id = ${order.shopId}::uuid AND currency = 'VND' AND pending_amount >= ${order.totalAmount}`;
      if (changed !== 1)
        throw new ConflictException({ code: "WALLET_BALANCE_INVALID", message: "Số dư chờ đối soát không hợp lệ" });
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "ORDER_SETTLEMENT",
          referenceId: order.id,
          idempotencyKey: `settlement:${order.id}`,
          description: `Settlement ${order.code}`,
          status: "POSTED",
          postedAt: new Date(),
          entries: {
            create: [
              { accountCode: `SELLER_PENDING:${order.shopId}`, direction: "DEBIT", amount: order.totalAmount },
              { accountCode: `SELLER_AVAILABLE:${order.shopId}`, direction: "CREDIT", amount: order.totalAmount },
            ],
          },
        },
      });
    });
    return this.order(userId, id);
  }

  async confirmDigitalReceived(userId: string, id: string) {
    const order = await this.db.order.findFirst({
      where: {
        id,
        group: { buyerId: userId },
        items: { some: { productType: { not: "PHYSICAL" } } },
      },
      include: { items: { include: { deliveries: true } } },
    });
    if (!order) throw new NotFoundException();
    if (order.status === "COMPLETED") {
      return { success: true, completedAt: order.updatedAt.toISOString() };
    }
    if (!["PAID", "PROCESSING"].includes(order.status))
      throw new ConflictException({
        code: "ORDER_STATE_INVALID",
        message: "Đơn hàng số không thể xác nhận ở trạng thái hiện tại",
      });

    const deliveries = order.items.flatMap((item) => item.deliveries);
    if (!deliveries.length || deliveries.some((delivery) => delivery.status !== "REVEALED"))
      throw new ConflictException({
        code: "DELIVERY_NOT_REVEALED",
        message: "Bạn cần xem đầy đủ thông tin bàn giao trước khi xác nhận",
      });

    const completedAt = new Date();
    await this.db.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id, status: { in: ["PAID", "PROCESSING"] } },
        data: { status: "COMPLETED" },
      });
      if (updated.count !== 1)
        throw new ConflictException({ code: "ORDER_STATE_CHANGED", message: "Trạng thái đơn hàng vừa thay đổi" });

      await tx.digitalDelivery.updateMany({
        where: { id: { in: deliveries.map((delivery) => delivery.id) } },
        data: { deliveredAt: completedAt },
      });
      const changed = await tx.$executeRaw`UPDATE wallets SET pending_amount = pending_amount - ${order.totalAmount}, available_amount = available_amount + ${order.totalAmount}, version = version + 1, updated_at = now() WHERE shop_id = ${order.shopId}::uuid AND currency = 'VND' AND pending_amount >= ${order.totalAmount}`;
      if (changed !== 1)
        throw new ConflictException({ code: "WALLET_BALANCE_INVALID", message: "Số dư chờ đối soát không hợp lệ" });
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "ORDER_SETTLEMENT",
          referenceId: order.id,
          idempotencyKey: `settlement:${order.id}`,
          description: `Settlement ${order.code}`,
          status: "POSTED",
          postedAt: completedAt,
          entries: {
            create: [
              { accountCode: `SELLER_PENDING:${order.shopId}`, direction: "DEBIT", amount: order.totalAmount },
              { accountCode: `SELLER_AVAILABLE:${order.shopId}`, direction: "CREDIT", amount: order.totalAmount },
            ],
          },
        },
      });
    });
    return { success: true, completedAt: completedAt.toISOString() };
  }
}
