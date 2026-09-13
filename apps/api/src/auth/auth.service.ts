import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { createHash, randomBytes, randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";
import { publicUser, requireText } from "../common/helpers";
import { EmailService } from "../platform/email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  private accessSecret() {
    return (
      process.env.JWT_ACCESS_SECRET ?? "local-access-secret-change-me-32chars"
    );
  }
  private refreshSecret() {
    return (
      process.env.JWT_REFRESH_SECRET ?? "local-refresh-secret-change-me-32chars"
    );
  }
  private async issue(user: any, sessionId?: string) {
    const roles = (user.roles ?? []).map((x: any) => x.role?.key ?? x);
    const sid = sessionId ?? randomUUID();
    const family = randomUUID();
    const accessToken = await this.jwt.signAsync({ sub: user.id, roles, sid }, {
      secret: this.accessSecret(),
      expiresIn: process.env.ACCESS_TOKEN_TTL ?? "15m",
    } as any);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid, family, type: "refresh" },
      {
        secret: this.refreshSecret(),
        expiresIn: `${Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30)}d`,
      } as any,
    );
    const expiresAt = new Date(
      Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 86400000,
    );
    await this.db.session.upsert({
      where: { id: sid },
      create: {
        id: sid,
        userId: user.id,
        tokenFamilyId: family,
        refreshTokenHash: await hash(refreshToken),
        expiresAt,
      },
      update: {
        refreshTokenHash: await hash(refreshToken),
        rotatedAt: new Date(),
        expiresAt,
      },
    });
    return {
      accessToken,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      user: publicUser(user),
    };
  }

  async register(body: any) {
    const fullName = requireText(body.fullName, "fullName", 2);
    const email = requireText(body.email, "email", 5).toLowerCase();
    const phone = requireText(body.phoneNumber, "phoneNumber", 8);
    const password = requireText(body.password, "password", 10);
    const exists = await this.db.user.findFirst({
      where: { OR: [{ emailNormalized: email }, { phoneNormalized: phone }] },
    });
    if (exists)
      throw new ConflictException({
        code: "ACCOUNT_EXISTS",
        message: "Email hoặc số điện thoại đã được sử dụng",
      });
    const buyerRole = await this.db.role.upsert({
      where: { key: "BUYER" },
      create: { key: "BUYER", description: "Marketplace buyer" },
      update: {},
    });
    const user = await this.db.user.create({
      data: {
        fullName,
        emailNormalized: email,
        phoneNormalized: phone,
        passwordHash: await hash(password),
        roles: { create: { roleId: buyerRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });
    return this.issue(user);
  }

  async login(body: any) {
    const email = requireText(body.email, "email").toLowerCase();
    const password = requireText(body.password, "password");
    const user = await this.db.user.findUnique({
      where: { emailNormalized: email },
      include: { roles: { include: { role: true } } },
    });
    const validPassword = user ? await verify(user.passwordHash, password) : false;
    if (!user || user.status !== "ACTIVE" || user.lockedUntil && user.lockedUntil > new Date() || !validPassword) {
      if (user && !validPassword) {
        const failed = user.failedLoginCount + 1;
        await this.db.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: failed >= 5 ? 0 : failed,
            lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60000) : user.lockedUntil,
          },
        });
      }
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng",
      });
    }
    if (user.failedLoginCount || user.lockedUntil)
      await this.db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    return this.issue(user);
  }

  async refresh(token: string | undefined) {
    if (!token)
      throw new UnauthorizedException({
        code: "REFRESH_REQUIRED",
        message: "Refresh token không tồn tại",
      });
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.refreshSecret(),
      });
      const session = await this.db.session.findUnique({
        where: { id: payload.sid },
        include: { user: { include: { roles: { include: { role: true } } } } },
      });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt < new Date() ||
        !(await verify(session.refreshTokenHash, token))
      ) {
        if (session)
          await this.db.session.updateMany({
            where: { tokenFamilyId: session.tokenFamilyId },
            data: { revokedAt: new Date(), reuseDetectedAt: new Date() },
          });
        throw new Error("invalid session");
      }
      return this.issue(session.user, session.id);
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Phiên đăng nhập không hợp lệ",
      });
    }
  }

  async logout(sessionId: string) {
    await this.db.session.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async requestPasswordReset(rawEmail: unknown) {
    const email = requireText(rawEmail, "email", 5).toLowerCase();
    const user = await this.db.user.findUnique({ where: { emailNormalized: email } });
    if (user) {
      const token = await this.createAccountToken(user.id, "PASSWORD_RESET", 30);
      await this.email.sendAccountLink(email, "Đặt lại mật khẩu", "/reset-password", token);
      return {
        accepted: true,
        ...(process.env.NODE_ENV !== "production" ? { developmentToken: token } : {}),
      };
    }
    return { accepted: true };
  }

  async resetPassword(token: unknown, rawPassword: unknown) {
    const value = requireText(token, "token", 20);
    const password = requireText(rawPassword, "password", 10);
    const record = await this.validAccountToken(value, "PASSWORD_RESET");
    await this.db.$transaction([
      this.db.user.update({ where: { id: record.userId }, data: { passwordHash: await hash(password), failedLoginCount: 0, lockedUntil: null } }),
      this.db.accountToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
      this.db.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return { reset: true };
  }

  async requestEmailVerification(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) return { verified: true };
    if (!user.emailNormalized) throw new BadRequestException();
    const token = await this.createAccountToken(user.id, "EMAIL_VERIFY", 24 * 60);
    await this.email.sendAccountLink(user.emailNormalized, "Xác minh email", "/verify-email", token);
    return {
      sent: true,
      ...(process.env.NODE_ENV !== "production" ? { developmentToken: token } : {}),
    };
  }

  async verifyEmail(token: unknown) {
    const value = requireText(token, "token", 20);
    const record = await this.validAccountToken(value, "EMAIL_VERIFY");
    await this.db.$transaction([
      this.db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      this.db.accountToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    ]);
    return { verified: true };
  }

  private async createAccountToken(userId: string, type: string, ttlMinutes: number) {
    const token = randomBytes(32).toString("base64url");
    await this.db.accountToken.create({
      data: {
        userId,
        type,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + ttlMinutes * 60000),
      },
    });
    return token;
  }

  private async validAccountToken(token: string, type: string) {
    const record = await this.db.accountToken.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    });
    if (!record || record.type !== type || record.consumedAt || record.expiresAt < new Date())
      throw new BadRequestException({ code: "INVALID_OR_EXPIRED_TOKEN", message: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
    return record;
  }
  async me(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    return publicUser(user);
  }
}
