import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

export const AUTHENTICATED_REQUEST = Symbol("AUTHENTICATED_REQUEST");

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<any>();
    if (req[AUTHENTICATED_REQUEST]) return true;
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
      req[AUTHENTICATED_REQUEST] = true;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên đăng nhập không hợp lệ",
      });
    }
  }
}
