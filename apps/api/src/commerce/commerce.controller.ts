import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CommerceService } from "./commerce.service";

@Controller()
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}
  @Get("cart") @UseGuards(AuthGuard) cart(@Req() req: any) {
    return this.commerce.cart(req.user.id);
  }
  @Post("cart/items") @UseGuards(AuthGuard) add(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.commerce.addCart(req.user.id, body);
  }
  @Patch("cart/items/:id") @UseGuards(AuthGuard) update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.commerce.updateCart(req.user.id, id, body);
  }
  @Patch("cart/items/:id/select") @UseGuards(AuthGuard) toggle(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.commerce.toggle(req.user.id, id);
  }
  @Patch("cart/select-all") @UseGuards(AuthGuard) selectAll(
    @Req() req: any,
    @Body("selected") selected: boolean,
  ) {
    return this.commerce.selectAll(req.user.id, selected);
  }
  @Delete("cart/items/:id") @UseGuards(AuthGuard) remove(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.commerce.removeCart(req.user.id, id);
  }
  @Post("checkout/preview") @HttpCode(200) @UseGuards(AuthGuard) preview(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.commerce.preview(req.user.id, body);
  }
  @Post("checkout/order-groups") @UseGuards(AuthGuard) create(
    @Req() req: any,
    @Body() body: any,
    @Headers("idempotency-key") key = "",
  ) {
    return this.commerce.createOrder(req.user.id, body, key);
  }
  @Post("checkout/create-order") @UseGuards(AuthGuard) createLegacy(
    @Req() req: any,
    @Body() body: any,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.commerce.createOrder(
      req.user.id,
      body,
      key ?? `legacy-${req.headers["x-request-id"] ?? crypto.randomUUID()}`,
    );
  }
  @Get("payments/:id") @UseGuards(AuthGuard) payment(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.commerce.payment(req.user.id, id);
  }
  @Get("payments/:id/status") @UseGuards(AuthGuard) async paymentStatus(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    const p = await this.commerce.payment(req.user.id, id);
    return { status: p.status, isPaid: p.status === "PAID" };
  }
  @Post("payments/:id/simulate-success")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async simulate(@Req() req: any, @Param("id") id: string) {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.ALLOW_DEV_PAYMENT_SIMULATOR !== "true"
    )
      throw new UnauthorizedException();
    await this.commerce.payment(req.user.id, id);
    await this.commerce.confirmPayment(id);
    return this.commerce.payment(req.user.id, id);
  }
  @Post("webhooks/sepay") @HttpCode(200) async sepay(
    @Headers("authorization") authorization: string,
    @Body() body: any,
  ) {
    if (
      !process.env.SEPAY_WEBHOOK_SECRET ||
      authorization !== `Bearer ${process.env.SEPAY_WEBHOOK_SECRET}`
    )
      throw new UnauthorizedException({
        code: "INVALID_WEBHOOK_AUTH",
        message: "Webhook authentication failed",
      });
    const text = String(body.content ?? body.description ?? "");
    const code = text.match(/MP[A-Z0-9]{12}/)?.[0];
    if (!code) return { accepted: true, matched: false };
    const externalId = String(
      body.id ?? body.transactionId ?? body.referenceCode ?? "",
    );
    const rawAmount = body.transferAmount ?? body.amount ?? 0;
    if (!externalId || !Number.isSafeInteger(Number(rawAmount)))
      return { accepted: true, matched: false };
    return this.commerce.processWebhook(code, externalId, BigInt(rawAmount));
  }
  @Get("orders") @UseGuards(AuthGuard) orders(
    @Req() req: any,
    @Query("status") status?: string,
  ) {
    return this.commerce.orders(req.user.id, status);
  }
  @Get("orders/digital") @UseGuards(AuthGuard) async digitalOrders(
    @Req() req: any,
  ) {
    return this.commerce.digitalOrders(req.user.id);
  }
  @Get("orders/:id") @UseGuards(AuthGuard) order(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.commerce.order(req.user.id, id);
  }
  @Post("orders/:id/cancel") @HttpCode(200) @UseGuards(AuthGuard) cancel(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.commerce.cancel(req.user.id, id);
  }
  @Post("orders/:id/confirm-received")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async received(@Req() req: any, @Param("id") id: string) {
    return this.commerce.confirmReceived(req.user.id, id);
  }
}
