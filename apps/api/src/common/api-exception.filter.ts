import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest<{
      headers: Record<string, string>;
      requestId?: string;
    }>();
    const prismaCode =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : prismaCode === "P2025"
          ? HttpStatus.NOT_FOUND
          : prismaCode === "P2002" || prismaCode === "P2003"
            ? HttpStatus.CONFLICT
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const object =
      typeof payload === "object" && payload
        ? (payload as Record<string, unknown>)
        : {};
    const rawMessage =
      object.message ??
      (error instanceof Error && status < 500
        ? error.message
        : "Internal server error");
    const message = Array.isArray(rawMessage)
      ? rawMessage.join("; ")
      : String(rawMessage);
    const code = String(
      object.code ?? (prismaCode === "P2002" ? "DUPLICATE_RESOURCE" : prismaCode === "P2003" ? "RESOURCE_IN_USE" : prismaCode === "P2025" ? "NOT_FOUND" : undefined) ??
        (status === 404
          ? "NOT_FOUND"
          : status === 401
            ? "UNAUTHORIZED"
            : status === 403
              ? "FORBIDDEN"
              : status === 409
                ? "CONFLICT"
                : status >= 500
                  ? "INTERNAL_ERROR"
                  : "VALIDATION_ERROR"),
    );
    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details: object.details ?? {},
        requestId:
          request.requestId ??
          request.headers["x-request-id"] ??
          `req_${crypto.randomUUID()}`,
      },
    });
  }
}
