import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<any>();
    const token = String(req.headers.authorization ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token)
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Bạn cần đăng nhập",
      });
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret:
          process.env.JWT_ACCESS_SECRET ??
          "local-access-secret-change-me-32chars",
      });
      const session = await this.db.session.findUnique({
        where: { id: payload.sid },
      });
      if (!session || session.revokedAt || session.expiresAt < new Date())
        throw new Error("revoked");
      req.user = {
        id: payload.sub,
        roles: payload.roles ?? [],
        sessionId: payload.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên đăng nhập không hợp lệ",
      });
    }
  }
}
