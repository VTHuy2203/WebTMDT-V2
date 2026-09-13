import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuthGuard } from "../auth/auth.guard";
import { CommerceService } from "../commerce/commerce.service";
import { MessagingService } from "../platform/messaging.service";
import { MessagingGateway } from "../platform/messaging.gateway";
import { OperationsService } from "./operations.service";

@Controller()
@UseGuards(AuthGuard)
export class OperationsController {
  constructor(
    private readonly ops: OperationsService,
    private readonly commerce: CommerceService,
    private readonly messaging: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  @Post("seller/apply") apply(@Req() req: any, @Body() body: any) {
    return this.ops.applySeller(req.user.id, body);
  }
  @Get("seller/my-application") myApplication(@Req() req: any) {
    return this.ops.myApplication(req.user.id);
  }
  @Get("seller/products") sellerProducts(@Req() req: any) {
    return this.ops.sellerProducts(req.user.id);
  }
  @Post("seller/products") sellerProduct(@Req() req: any, @Body() body: any) {
    return this.ops.createProduct(req.user.id, body);
  }
  @Get("seller/game-account-products") sellerGames(@Req() req: any) {
    return this.ops.sellerProducts(req.user.id, "DIGITAL_GAME_ACCOUNT");
  }
  @Post("seller/game-account-products") sellerGame(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.createProduct(req.user.id, {
      ...body,
      type: "DIGITAL_GAME_ACCOUNT",
    });
  }
  @Get("seller/app-account-products") sellerApps(@Req() req: any) {
    return this.ops.sellerProducts(req.user.id, "DIGITAL_APP_ACCOUNT");
  }
  @Post("seller/app-account-products") sellerApp(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.createProduct(req.user.id, {
      ...body,
      type: "DIGITAL_APP_ACCOUNT",
    });
  }
  @Get("seller/orders") sellerOrders(
    @Req() req: any,
    @Query("status") status?: string,
  ) {
    return this.commerce.sellerOrders(req.user.id, status);
  }
  @Get("seller/digital-orders") async sellerDigital(@Req() req: any) {
    return this.commerce.sellerDigitalOrders(req.user.id);
  }
  @Get("seller/app-orders") async sellerAppOrders(@Req() req: any) {
    return this.commerce.sellerDigitalOrders(req.user.id, true);
  }
  @Post("seller/orders/:id/accept") @HttpCode(200) async acceptOrder(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    const shop = await this.ops.sellerShop(req.user.id);
    return this.ops.db.order.updateMany({
      where: { id, shopId: shop.id, status: "PAID" },
      data: { status: "PROCESSING" },
    });
  }
  @Patch("seller/orders/:id/status") async legacyOrderStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    const shop = await this.ops.sellerShop(req.user.id);
    const allowed: Record<string, string[]> = {
      PAID: ["PROCESSING"],
      PROCESSING: ["READY_TO_SHIP"],
      READY_TO_SHIP: ["SHIPPING"],
      SHIPPING: ["DELIVERED"],
    };
    const current = await this.ops.db.order.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!current || !allowed[current.status]?.includes(status)) return current;
    return this.ops.db.order.update({
      where: { id },
      data: { status: status as any },
    });
  }
  @Patch("seller/inventory/:variantId") async stock(
    @Req() req: any,
    @Param("variantId") id: string,
    @Body("stock") stock: number,
  ) {
    const shop = await this.ops.sellerShop(req.user.id);
    return this.ops.db.productVariant.updateMany({
      where: { id, product: { shopId: shop.id } },
      data: {
        stockOnHand: Math.max(0, Number(stock)),
        version: { increment: 1 },
      },
    });
  }
  @Get("seller/dashboard") async sellerDashboard(@Req() req: any) {
    const shop = await this.ops.sellerShop(req.user.id);
    const [ordersCount, pendingShipmentCount, lowStockCount, totals] =
      await Promise.all([
        this.ops.db.order.count({ where: { shopId: shop.id } }),
        this.ops.db.order.count({
          where: { shopId: shop.id, status: { in: ["PAID", "PROCESSING"] } },
        }),
        this.ops.db.productVariant.count({
          where: { product: { shopId: shop.id }, stockOnHand: { lte: 5 } },
        }),
        this.ops.db.order.aggregate({
          where: {
            shopId: shop.id,
            status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
          },
          _sum: { totalAmount: true },
        }),
      ]);
    return {
      revenue: Number(totals._sum.totalAmount ?? 0),
      ordersCount,
      pendingShipmentCount,
      lowStockCount,
      rating: Number(shop.ratingAverage),
      recentReviewsCount: 0,
    };
  }
  @Get("seller/finance") async finance(@Req() req: any) {
    return this.ops.sellerFinance(req.user.id);
  }
  @Post("seller/payouts") @HttpCode(202) async payout(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.requestPayout(req.user.id, body);
  }

  @Get("seller/game-inventory") gameInventory(
    @Req() req: any,
    @Query() q: any,
  ) {
    return this.ops.inventory(req.user.id, q, "DIGITAL_GAME_ACCOUNT");
  }
  @Post("seller/game-inventory") gameInventoryAdd(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.addInventory(req.user.id, body);
  }
  @Get("seller/app-inventory") appInventory(@Req() req: any, @Query() q: any) {
    return this.ops.inventory(req.user.id, q, "DIGITAL_APP_ACCOUNT");
  }
  @Post("seller/app-inventory/item") appInventoryAdd(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.addInventory(req.user.id, body);
  }
  @Post("seller/game-inventory/:id/disable") disableGame(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.ops.inventoryStatus(req.user.id, id, false);
  }
  @Post("seller/game-inventory/:id/enable") enableGame(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.ops.inventoryStatus(req.user.id, id, true);
  }
  @Post("seller/app-inventory/:id/disable") disableApp(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.ops.inventoryStatus(req.user.id, id, false);
  }
  @Post("seller/app-inventory/:id/enable") enableApp(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.ops.inventoryStatus(req.user.id, id, true);
  }
  @Post("seller/game-inventory/bulk") bulkGame(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.bulkInventory(req, body);
  }
  @Post("seller/app-inventory/bulk") bulkApp(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.bulkInventory(req, body);
  }
  private async bulkInventory(req: any, body: any) {
    const lines = String(body.rawText ?? "")
      .split(/\r?\n/)
      .filter(Boolean);
    let importedCount = 0;
    const errors: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const [login, password] = lines[i].split("|");
      try {
        await this.ops.addInventory(req.user.id, {
          productId: body.productId,
          planId: body.planId,
          credentials: { login, password },
          internalCode: `BULK-${randomUUID().slice(0, 8)}`,
        });
        importedCount++;
      } catch (e: any) {
        errors.push({ line: i + 1, reason: e.message });
      }
    }
    return { importedCount, errorCount: errors.length, errors };
  }

  @Get("digital-delivery/:orderId/summary") async deliverySummary(
    @Req() req: any,
    @Param("orderId") id: string,
  ) {
    return this.ops.delivery(
      req.user.id,
      await this.ops.resolveDigitalItem(req.user.id, id),
    );
  }
  @Post("digital-delivery/:orderId/reveal") @HttpCode(200) async revealLegacy(
    @Req() req: any,
    @Param("orderId") id: string,
    @Body("authPass") authPass: string,
  ) {
    return this.ops.delivery(
      req.user.id,
      await this.ops.resolveDigitalItem(req.user.id, id),
      true,
      authPass,
    );
  }
  @Get("digital-deliveries/:orderItemId") delivery(
    @Req() req: any,
    @Param("orderItemId") id: string,
  ) {
    return this.ops.delivery(req.user.id, id);
  }
  @Post("digital-deliveries/:orderItemId/reveal") @HttpCode(200) reveal(
    @Req() req: any,
    @Param("orderItemId") id: string,
    @Body("authPass") authPass: string,
  ) {
    return this.ops.delivery(req.user.id, id, true, authPass);
  }
  @Post("digital-delivery/:orderId/confirm") @HttpCode(200) confirm(
    @Req() req: any,
    @Param("orderId") orderId: string,
  ) {
    return this.commerce.confirmDigitalReceived(req.user.id, orderId);
  }
  @Post("digital-delivery/:orderId/dispute") createDispute(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.ops.createDigitalDispute(req.user.id, {
      ...body,
      orderId: body.orderId ?? req.params.orderId,
    });
  }
  @Get("digital-disputes") disputes(@Req() req: any) {
    return this.ops.disputesFor(req.user.id, req.user.roles);
  }
  @Get("digital-disputes/:id") dispute(@Req() req: any, @Param("id") id: string) {
    return this.ops.disputeById(req.user.id, req.user.roles, id);
  }
  @Post("digital-disputes/:id/respond") @HttpCode(200) async disputeRespond(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.respondDispute(req.user.id, id, body.message);
  }
  @Post("digital-disputes/:id/resolve") @HttpCode(200) resolveDisputeLegacy(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.resolveDispute(req.user, id, body);
  }

  @Get("warranties") async warranties(@Req() req: any) {
    return this.ops.db.warranty.findMany({
      where: { orderItem: { order: { group: { buyerId: req.user.id } } } },
      include: { orderItem: { include: { snapshot: true } } },
    });
  }
  @Post("warranties/claims") warrantyClaim(@Req() req: any, @Body() body: any) {
    return this.ops.createWarrantyClaim(req.user.id, body);
  }
  @Post("returns") returnRequest(@Req() req: any, @Body() body: any) {
    return this.ops.createReturn(req.user.id, body);
  }
  @Post("reports") report(@Req() req: any, @Body() body: any) {
    return this.ops.createDoc(
      "USER_REPORT",
      { ...body, ticketCode: `RP-${Date.now()}` },
      req.user.id,
      body.shopId,
    );
  }
  @Post("shops/:id/follow") follow(
    @Req() req: any,
    @Param("id") id: string,
    @Body("isFollowing") value: boolean,
  ) {
    return this.ops.toggleShopEngagement(req.user.id, id, "FOLLOW", value);
  }
  @Post("shops/:id/like") like(
    @Req() req: any,
    @Param("id") id: string,
    @Body("isLiked") value: boolean,
  ) {
    return this.ops.toggleShopEngagement(req.user.id, id, "LIKE", value);
  }
  @Get("shops/:id/reviews") reviews(
    @Param("id") id: string,
    @Query("productId") productId?: string,
  ) {
    return this.ops.shopReviews(id, productId);
  }
  @Post("shops/:id/reviews") review(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.createShopReview(req.user.id, id, body);
  }
  @Get("shops/:id/purchase-eligibility") async eligible(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    const order = await this.ops.db.order.findFirst({
      where: {
        shopId: id,
        group: { buyerId: req.user.id },
        status: "COMPLETED",
      },
    });
    return {
      hasPurchased: Boolean(order),
      orderId: order?.id,
      orderCode: order?.code,
    };
  }

  @Get("admin/dashboard") async adminDashboard(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const [
      totalOrders,
      activeUsers,
      activeShops,
      pendingSellersCount,
      pendingProductsCount,
      gmv,
    ] = await Promise.all([
      this.ops.db.order.count(),
      this.ops.db.user.count({ where: { status: "ACTIVE" } }),
      this.ops.db.shop.count({ where: { status: "ACTIVE" } }),
      this.ops.db.sellerApplication.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      this.ops.db.product.count({ where: { status: "PENDING_REVIEW" } }),
      this.ops.db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
        },
      }),
    ]);
    return {
      gmv: Number(gmv._sum.totalAmount ?? 0),
      revenue: 0,
      totalOrders,
      activeUsers,
      activeShops,
      pendingSellersCount,
      pendingProductsCount,
    };
  }
  @Get("admin/seller-applications") adminApplications(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.sellerApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
  @Post("admin/seller-applications/:id/review") @HttpCode(200) reviewSeller(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.reviewSeller(req.user, id, body);
  }
  @Get("admin/products/pending") adminProducts(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.product.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { variants: true, appPlans: true },
    });
  }
  @Post("admin/products/:id/review") @HttpCode(200) reviewProduct(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.reviewProduct(req.user, id, body);
  }
  @Get("admin/orders") adminOrders(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.commerce.adminOrders();
  }
  @Get("admin/shops") adminShops(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.shop.findMany();
  }
  @Post("admin/shops/:id/warn") sanctionWarn(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.sanction(req, id, "WARNING", body);
  }
  @Post("admin/shops/:id/suspend") sanctionSuspend(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.sanction(req, id, "SUSPENDED", body);
  }
  @Post("admin/shops/:id/ban") sanctionBan(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.sanction(req, id, "BANNED", body);
  }
  @Post("admin/shops/:id/reactivate") sanctionRestore(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.sanction(req, id, "ACTIVE", {});
  }
  private sanction(req: any, id: string, status: string, body: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.$transaction([
      this.ops.db.shop.update({
        where: { id },
        data: { status: status as any },
      }),
      this.ops.db.auditLog.create({
        data: {
          actorUserId: req.user.id,
          action: `SHOP_${status}`,
          targetType: "SHOP",
          targetId: id,
          reason: body.reason,
          requestId: req.requestId ?? randomUUID(),
        },
      }),
    ]);
  }
  @Get("admin/reports") adminReports(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.docs("USER_REPORT");
  }
  @Get("admin/digital-disputes") adminDisputes(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.disputesFor(req.user.id, req.user.roles);
  }
  @Post("admin/digital-disputes/:id/resolve") resolveDispute(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ops.resolveDispute(req.user, id, body);
  }
  @Get("admin/game-catalog") adminGames(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.docs("GAME_CATALOG");
  }
  @Post("admin/game-catalog") adminGame(@Req() req: any, @Body() body: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.upsertCatalog("GAME_CATALOG", body);
  }
  @Get("admin/application-catalog") adminApps(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.docs("APP_CATALOG");
  }
  @Post("admin/application-catalog") adminApp(
    @Req() req: any,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.upsertCatalog("APP_CATALOG", body);
  }
  @Get("admin/game-account-products") adminGameProducts(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.product.findMany({
      where: { type: "DIGITAL_GAME_ACCOUNT" },
    });
  }
  @Get("admin/app-account-products") adminAppProducts(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.product.findMany({
      where: { type: "DIGITAL_APP_ACCOUNT" },
    });
  }
  @Post("admin/game-account-products/:id/:action") reviewGame(
    @Req() req: any,
    @Param("id") id: string,
    @Param("action") action: string,
  ) {
    return this.ops.reviewProduct(req.user, id, {
      action: action.toUpperCase(),
    });
  }
  @Post("admin/app-account-products/:id/:action") reviewApp(
    @Req() req: any,
    @Param("id") id: string,
    @Param("action") action: string,
  ) {
    return this.ops.reviewProduct(req.user, id, {
      action: action.toUpperCase(),
    });
  }
  @Get("admin/users") async adminUsers(@Req() req: any, @Query() q: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    const users = await this.ops.db.user.findMany({
      where: {
        ...(q.status ? { status: q.status } : {}),
        ...(q.query
          ? {
              OR: [
                { fullName: { contains: q.query, mode: "insensitive" } },
                { emailNormalized: { contains: q.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        emailNormalized: true,
        phoneNormalized: true,
        status: true,
        createdAt: true,
      },
    });
    return users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.emailNormalized,
      phoneNumber: user.phoneNormalized,
      status: user.status,
      walletBalance: 0,
      createdAt: user.createdAt.toISOString(),
    }));
  }
  @Get("admin/users/:id") async adminUser(@Req() req: any, @Param("id") id: string) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    const user = await this.ops.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        emailNormalized: true,
        phoneNormalized: true,
        status: true,
        createdAt: true,
      },
    });
    return user
      ? {
          id: user.id,
          fullName: user.fullName,
          email: user.emailNormalized,
          phoneNumber: user.phoneNormalized,
          status: user.status,
          walletBalance: 0,
          createdAt: user.createdAt.toISOString(),
        }
      : null;
  }
  @Post("admin/users/:id/ban") banUser(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.db.user.update({
      where: { id },
      data: { status: "BANNED" },
      select: { id: true, fullName: true, emailNormalized: true, status: true },
    });
  }
  @Post("admin/users/:id/unban") unbanUser(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.db.user.update({
      where: { id },
      data: { status: "ACTIVE" },
      select: { id: true, fullName: true, emailNormalized: true, status: true },
    });
  }
  @Delete("admin/users/:id") deleteUser(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    this.ops.requireRole(req.user, ["SUPER_ADMIN"]);
    return this.ops.db.user.update({
      where: { id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        emailNormalized: null,
        phoneNormalized: null,
      },
      select: { id: true, fullName: true, status: true, deletedAt: true },
    });
  }
  @Post("admin/users/:id/notes") note(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.createDoc("USER_NOTE", body, id);
  }
  @Get("admin/categories/schemas") schemas(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.db.category.findMany();
  }
  @Post("admin/categories/schemas") saveSchema(
    @Req() req: any,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.db.category.update({
      where: { id: body.categoryId },
      data: { attributeSchema: body.fields, schemaVersion: { increment: 1 } },
    });
  }
  @Post("admin/reports/:id/resolve") resolveReport(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    return this.ops.db.resourceDocument.update({
      where: { id },
      data: { status: "RESOLVED", document: body },
    });
  }
  @Get("admin/conversations") conversations(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.messaging.adminList();
  }
  @Post("admin/conversations/:id/reply") async reply(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    const result = await this.messaging.adminReply(req.user.id, id, body);
    const participantIds = await this.messaging.participantIds(id);
    for (const message of result.messages) {
      this.messagingGateway.server?.to(`conversation:${id}`).emit("message.created", message);
      for (const userId of participantIds) {
        this.messagingGateway.emitToUser(userId, "message.created", message);
        if (userId !== message.senderId)
          this.messagingGateway.emitToUser(userId, "notification.created", { type: "NEW_MESSAGE", conversationId: id });
      }
    }
    return result.message;
  }
  @Patch("admin/conversations/:id/status") conversationStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.messaging.adminStatus(id, status);
  }
  @Patch("admin/conversations/:id/automation") async conversationAutomation(
    @Req() req: any,
    @Param("id") id: string,
    @Body("enabled") enabled: boolean,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    if (typeof enabled !== "boolean")
      throw new BadRequestException({ code: "INVALID_AUTOMATION_STATE", message: "Trạng thái Auto không hợp lệ" });
    const conversation = await this.messaging.adminAutomation(
      req.user.id,
      id,
      enabled,
      req.requestId ?? randomUUID(),
    );
    const payload = { conversationId: id, automationEnabled: conversation.automationEnabled };
    this.messagingGateway.server?.to(`conversation:${id}`).emit("conversation.automation.changed", payload);
    for (const userId of await this.messaging.participantIds(id))
      this.messagingGateway.emitToUser(userId, "conversation.automation.changed", payload);
    return payload;
  }
  @Put("admin/users/:id") async legacyUpdateUser(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    const allowed: any = {};
    if (body.fullName) allowed.fullName = body.fullName;
    if (body.phoneNumber) allowed.phoneNormalized = body.phoneNumber;
    return this.ops.db.user.update({
      where: { id },
      data: allowed,
      select: {
        id: true,
        fullName: true,
        emailNormalized: true,
        phoneNormalized: true,
        status: true,
      },
    });
  }
  @Post("admin/users/:id/adjust-balance") async adjustBalance(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["SUPER_ADMIN", "FINANCE_ADMIN"]);
    const amount = BigInt(body.amount ?? 0);
    const wallet = await this.ops.db.wallet.upsert({
      where: {
        ownerType_ownerId_currency: {
          ownerType: "USER",
          ownerId: id,
          currency: "VND",
        },
      },
      create: {
        ownerType: "USER",
        ownerId: id,
        currency: "VND",
        availableAmount: amount,
      },
      update: { availableAmount: { increment: amount } },
    });
    await this.ops.db.auditLog.create({
      data: {
        actorUserId: req.user.id,
        action: "WALLET_ADJUST",
        targetType: "USER",
        targetId: id,
        reason: body.reason,
        requestId: req.requestId ?? randomUUID(),
        metadata: { amount: String(amount) },
      },
    });
    return { newBalance: Number(wallet.availableAmount) };
  }
  @Post("app-accounts/applications") createApplication(
    @Req() req: any,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.upsertCatalog("APP_CATALOG", body);
  }
  @Put("app-accounts/applications/:id") async updateApplication(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return this.ops.db.resourceDocument.update({
      where: { id },
      data: { document: body, slug: body.slug },
    });
  }
  @Delete("app-accounts/applications/:id") async deleteApplication(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    await this.ops.db.resourceDocument.delete({ where: { id } });
    return null;
  }
  @Post("app-accounts/applications/reset") resetApplications(@Req() req: any) {
    this.ops.requireRole(req.user, ["ADMIN", "SUPER_ADMIN"]);
    return [];
  }
  @Delete("seller/game-inventory/:id") deleteGameInventory(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.deleteDraftInventory(req, id);
  }
  @Delete("seller/app-inventory/:id") deleteAppInventory(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.deleteDraftInventory(req, id);
  }
  private async deleteDraftInventory(req: any, id: string) {
    const shop = await this.ops.sellerShop(req.user.id);
    return this.ops.db.inventoryItem.deleteMany({
      where: { id, status: "DRAFT", product: { shopId: shop.id } },
    });
  }
  @Get("seller/app-products/:productId/capacities") async capacities(
    @Req() req: any,
    @Param("productId") productId: string,
  ) {
    const shop = await this.ops.sellerShop(req.user.id);
    const plans = await this.ops.db.appPlan.findMany({
      where: { productId, product: { shopId: shop.id } },
      include: { inventoryItems: true },
    });
    return plans.map((p) => ({
      productId,
      planId: p.id,
      planName: p.name,
      fulfillmentType: p.fulfillmentType,
      totalSlots: p.inventoryItems.length,
      availableSlots: p.inventoryItems.filter((i) => i.status === "AVAILABLE")
        .length,
    }));
  }
  @Put("seller/app-products/:productId/plans/:planId/capacity") async capacity(
    @Req() req: any,
    @Param("productId") productId: string,
    @Param("planId") planId: string,
    @Body("totalSlots") totalSlots: number,
  ) {
    const list: any[] = await this.capacities(req, productId);
    return {
      ...(list.find((x) => x.planId === planId) ?? { productId, planId }),
      totalSlots,
    };
  }
  @Get("app-orders/:orderId/delivery") async appDelivery(
    @Req() req: any,
    @Param("orderId") id: string,
  ) {
    const itemId = await this.ops.resolveDigitalItem(req.user.id, id);
    const value: any = await this.ops.delivery(req.user.id, itemId, true);
    return value.content ?? value.credentials?.[0];
  }
  @Post("app-orders/:orderId/buyer-fields") buyerFields(
    @Req() req: any,
    @Param("orderId") id: string,
    @Body("buyerProvidedValues") values: any,
  ) {
    return this.ops.createDoc(
      "APP_BUYER_FIELDS",
      { orderId: id, buyerProvidedValues: values },
      req.user.id,
    );
  }
  @Post("seller/app-orders/:orderId/complete") completeAppOrder(
    @Req() req: any,
    @Param("orderId") id: string,
    @Body() body: any,
  ) {
    return this.ops.createDoc(
      "APP_DELIVERY_RESULT",
      { orderId: id, ...body },
      req.user.id,
    );
  }
  @Post("seller/app-orders/:orderId/resend-invite") resendInvite(
    @Req() req: any,
    @Param("orderId") id: string,
  ) {
    return { orderId: id, resentAt: new Date().toISOString() };
  }
}
