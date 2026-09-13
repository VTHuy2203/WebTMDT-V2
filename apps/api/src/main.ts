import "./instrument";
import "reflect-metadata";
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser = require("cookie-parser");
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { EnvelopeInterceptor } from "./common/envelope.interceptor";
import { RequestLoggingInterceptor } from "./common/request-logging.interceptor";
import { correlationIdMiddleware } from "./common/request-context";
import { StructuredLogger } from "./common/structured-logger";
import { RedisIoAdapter } from "./platform/redis-io.adapter";

function validateEnvironment() {
  if (process.env.NODE_ENV !== "production") return;
  const required = [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CREDENTIAL_MASTER_KEY",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "SEPAY_WEBHOOK_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(`Missing required production environment: ${missing.join(", ")}`);
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CREDENTIAL_MASTER_KEY"])
    if (String(process.env[key]).length < 32)
      throw new Error(`${key} must contain at least 32 characters`);
}

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new StructuredLogger(),
  });
  app.enableShutdownHooks();
  const redisIoAdapter = new RedisIoAdapter(
    app,
    process.env.REDIS_URL ?? "redis://localhost:6379",
  );
  await redisIoAdapter.connect();
  app.useWebSocketAdapter(redisIoAdapter);
  app.setGlobalPrefix("api/v1");
  app.use(correlationIdMiddleware);
  app.use(helmet());
  app.use(cookieParser());
  const origins = (
    process.env.CORS_ORIGINS ??
    "http://localhost:3000,http://localhost:3001,http://localhost:3002"
  ).split(",");
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "Idempotency-Key",
      "X-Client-App",
    ],
    exposedHeaders: ["X-Request-ID"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new EnvelopeInterceptor(),
  );
  const config = new DocumentBuilder()
    .setTitle("Marketplace API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, config),
  );
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
