import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface RequestContextStore {
  requestId: string;
}

const requestContext = new AsyncLocalStorage<RequestContextStore>();
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function normalizeRequestId(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate === "string" && REQUEST_ID_PATTERN.test(candidate))
    return candidate;
  return `req_${randomUUID()}`;
}

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function correlationIdMiddleware(
  request: {
    headers?: Record<string, unknown>;
    requestId?: string;
  },
  response: { setHeader(name: string, value: string): void },
  next: () => void,
) {
  const requestId = normalizeRequestId(request.headers?.["x-request-id"]);
  request.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);
  requestContext.run({ requestId }, next);
}
