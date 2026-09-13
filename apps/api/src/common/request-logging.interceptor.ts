import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import {
  pseudonymizeIdentifier,
  safeRequestPath,
  writeStructuredLog,
} from "./structured-logger";

export const REQUEST_ERROR_LOGGED = Symbol("request-error-logged");

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<any>();
    const response = context.switchToHttp().getResponse<any>();
    const startedAt = Date.now();
    const fields = (statusCode: number) => ({
      method: request.method,
      path: safeRequestPath(request.originalUrl ?? request.url),
      statusCode,
      durationMs: Date.now() - startedAt,
      requestId: request.requestId,
      actorIdHash: pseudonymizeIdentifier(request.user?.id),
    });
    return next.handle().pipe(
      tap({
        complete: () => {
          const statusCode = response.statusCode;
          writeStructuredLog(
            statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info",
            "http_request",
            fields(statusCode),
          );
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;
          request[REQUEST_ERROR_LOGGED] = true;
          writeStructuredLog(statusCode >= 500 ? "error" : "warn", "http_request", {
            ...fields(statusCode),
            ...(statusCode >= 500 ? { error } : {}),
          });
        },
      }),
    );
  }
}
