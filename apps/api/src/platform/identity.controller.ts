import { Body, Controller, Get, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { IdentityService } from "./identity.service";

@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get("identity-verification")
  @UseGuards(AuthGuard)
  status(@Req() req: any) {
    return this.identity.status(req.user.id);
  }

  @Post("identity-verification")
  @UseGuards(AuthGuard)
  submit(@Req() req: any, @Body() body: any) {
    return this.identity.submit(req.user.id, body);
  }

  @Post("webhooks/kyc")
  webhook(@Req() req: any, @Headers("x-signature") signature: string = "", @Body() body: any) {
    return this.identity.webhook(signature, req.rawBody, body);
  }
}
