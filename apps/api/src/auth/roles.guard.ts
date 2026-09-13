import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTHENTICATED_REQUEST, AuthGuard } from "./auth.guard";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest<any>();
    if (!req[AUTHENTICATED_REQUEST]) await this.auth.canActivate(context);
    if (!req.user?.roles?.some((role: string) => roles.includes(role)))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Bạn không có quyền thực hiện thao tác này",
      });
    return true;
  }
}
