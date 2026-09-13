import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ShippingService } from "./shipping.service";

@Controller()
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Post("seller/orders/:id/shipment")
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.shipping.create(req.user, id, body);
  }

  @Get("orders/:id/shipment")
  @UseGuards(AuthGuard)
  get(@Req() req: any, @Param("id") id: string) {
    return this.shipping.get(req.user.id, req.user.roles, id);
  }

  @Post("webhooks/shipping/:provider")
  webhook(
    @Req() req: any,
    @Param("provider") provider: string,
    @Headers("x-signature") signature: string = "",
    @Body() body: any,
  ) {
    return this.shipping.webhook(provider.toUpperCase(), signature, req.rawBody, body);
  }
}
