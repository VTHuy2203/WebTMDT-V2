import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint")
    return Number(value) <= Number.MAX_SAFE_INTEGER
      ? Number(value)
      : value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, jsonSafe(v)]),
    );
  return value;
}

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; requestId?: string }>();
    const requestId =
      request.headers["x-request-id"] || `req_${crypto.randomUUID()}`;
    request.requestId = requestId;
    return next.handle().pipe(
      map((value) =>
        value?.success === true
          ? jsonSafe(value)
          : {
              success: true,
              data: jsonSafe(value ?? null),
              meta: { requestId },
            },
      ),
    );
  }
}
