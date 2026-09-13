import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nestjs";
import { REQUEST_ERROR_LOGGED } from "./request-logging.interceptor";
import { safeRequestPath, writeStructuredLog } from "./structured-logger";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest<{
      headers: Record<string, string>;
      requestId?: string;
      method?: string;
      originalUrl?: string;
      url?: string;
      [REQUEST_ERROR_LOGGED]?: boolean;
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
    const requestId =
      request.requestId ??
      request.headers["x-request-id"] ??
      `req_${crypto.randomUUID()}`;
    if (status >= 500) {
      if (!request[REQUEST_ERROR_LOGGED])
        writeStructuredLog("error", "http_request", {
          method: request.method,
          path: safeRequestPath(request.originalUrl ?? request.url),
          statusCode: status,
          requestId,
          error,
        });
      Sentry.withScope((scope) => {
        scope.setTag("request_id", requestId);
        scope.setContext("request", {
          method: request.method,
          path: safeRequestPath(request.originalUrl ?? request.url),
        });
        Sentry.captureException(error);
      });
    }
    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details: object.details ?? {},
        requestId,
      },
    });
  }
}
