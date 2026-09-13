import { createHash } from "node:crypto";
import { LoggerService } from "@nestjs/common";
import { getRequestId } from "./request-context";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "setcookie",
  "password",
  "passwordhash",
  "passcode",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "secret",
  "apikey",
  "credential",
  "privatekey",
  "clientsecret",
  "signature",
  "cvv",
  "pin",
];
const PII_KEYS = [
  "email",
  "emailnormalized",
  "phone",
  "phonenumber",
  "address",
  "fullname",
  "firstname",
  "lastname",
  "taxcode",
  "nationalid",
  "identitynumber",
  "cardnumber",
];

function normalizedKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isPrivateKey(key: string) {
  const normalized = normalizedKey(key);
  return [...SENSITIVE_KEYS, ...PII_KEYS].some(
    (candidate) =>
      normalized === candidate ||
      normalized.endsWith(candidate) ||
      normalized.startsWith(candidate),
  );
}

function sanitizeString(value: string): string {
  return value
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, `$1 ${REDACTED}`)
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, REDACTED)
    .replace(/([?&](?:token|secret|password|email|phone|api[_-]?key)=)[^&#\s]*/gi, `$1${REDACTED}`)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED)
    .replace(/\b(?:\+?84|0)(?:[ .-]?\d){9,10}\b/g, REDACTED);
}

export function redactLogValue(
  value: unknown,
  key = "",
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (isPrivateKey(key)) return REDACTED;
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number")
    return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return sanitizeString(value);
  if (depth >= 8) return "[TRUNCATED]";
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error)
    return {
      name: sanitizeString(value.name),
      message: sanitizeString(value.message),
      stack: value.stack ? sanitizeString(value.stack) : undefined,
    };
  if (typeof value !== "object") return sanitizeString(String(value));
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value))
    return value.map((entry) => redactLogValue(entry, "", depth + 1, seen));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactLogValue(entryValue, entryKey, depth + 1, seen),
    ]),
  );
}

export function safeRequestPath(url: unknown): string {
  if (typeof url !== "string" || !url) return "/";
  try {
    return new URL(url, "http://request.local").pathname;
  } catch {
    return sanitizeString(url.split("?")[0]?.split("#")[0] || "/");
  }
}

export function pseudonymizeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const salt =
    process.env.LOG_HASH_SALT ??
    process.env.CREDENTIAL_MASTER_KEY ??
    "local-development-log-salt";
  return createHash("sha256")
    .update(salt)
    .update("\0")
    .update(value)
    .digest("hex")
    .slice(0, 16);
}

export function writeStructuredLog(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const requestId = fields.requestId ?? getRequestId();
  const record = redactLogValue({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: process.env.SERVICE_NAME ?? "marketplace-api",
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE || undefined,
    requestId,
    ...fields,
  });
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

function splitContext(optionalParams: unknown[]) {
  const last = optionalParams.at(-1);
  return typeof last === "string" && optionalParams.length
    ? { context: last, details: optionalParams.slice(0, -1) }
    : { context: undefined, details: optionalParams };
}

export class StructuredLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]) {
    const { context, details } = splitContext(optionalParams);
    writeStructuredLog("info", "application_log", { context, message, details });
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    const { context, details } = splitContext(optionalParams);
    writeStructuredLog("error", "application_error", { context, message, details });
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    const { context, details } = splitContext(optionalParams);
    writeStructuredLog("warn", "application_log", { context, message, details });
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    const { context, details } = splitContext(optionalParams);
    writeStructuredLog("debug", "application_log", { context, message, details });
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.debug(message, ...optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    const { context, details } = splitContext(optionalParams);
    writeStructuredLog("fatal", "application_error", { context, message, details });
  }
}
