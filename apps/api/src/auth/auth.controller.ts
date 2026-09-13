import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private refreshCookie(req: any) {
    const requested = String(req.headers?.["x-client-app"] ?? "buyer").toLowerCase();
    const client = ["buyer", "seller", "admin"].includes(requested) ? requested : "buyer";
    return `marketplace_refresh_${client}`;
  }
  private setRefresh(req: any, res: Response, token: string) {
    res.cookie(this.refreshCookie(req), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 86400000,
    });
    res.clearCookie("marketplace_refresh", { path: "/api/v1/auth" });
  }
  @Post("register") async register(
    @Req() req: any,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const value = await this.auth.register(body);
    this.setRefresh(req, res, value.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = value;
    return safe;
  }
  @Post("login") @HttpCode(200) async login(
    @Req() req: any,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const value = await this.auth.login(body);
    this.setRefresh(req, res, value.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = value;
    return safe;
  }
  @Post("refresh") @HttpCode(200) async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const value = await this.auth.refresh(req.cookies?.[this.refreshCookie(req)]);
    this.setRefresh(req, res, value.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = value;
    return safe;
  }
  @Post("logout") @HttpCode(204) @UseGuards(AuthGuard) async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.user.sessionId);
    res.clearCookie(this.refreshCookie(req), { path: "/api/v1/auth" });
    res.clearCookie("marketplace_refresh", { path: "/api/v1/auth" });
  }
  @Get("me") @UseGuards(AuthGuard) me(@Req() req: any) {
    return this.auth.me(req.user.id);
  }
  @Post("forgot-password") @HttpCode(202) forgot(@Body("email") email: string) {
    return this.auth.requestPasswordReset(email);
  }
  @Post("reset-password") @HttpCode(200) reset(@Body() body: any) {
    return this.auth.resetPassword(body.token, body.password);
  }
  @Post("email-verification/request") @HttpCode(202) @UseGuards(AuthGuard) requestVerification(@Req() req: any) {
    return this.auth.requestEmailVerification(req.user.id);
  }
  @Post("email-verification/confirm") @HttpCode(200) verifyEmail(@Body("token") token: string) {
    return this.auth.verifyEmail(token);
  }
}
