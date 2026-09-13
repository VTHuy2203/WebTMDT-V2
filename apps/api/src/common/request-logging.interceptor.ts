import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<any>();
    const response = context.switchToHttp().getResponse<any>();
    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        finalize: () => {
          const event = {
            level: "info",
            event: "http_request",
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            requestId: request.requestId,
            userId: request.user?.id,
          };
          process.stdout.write(`${JSON.stringify(event)}\n`);
        },
      }),
    );
  }
}
