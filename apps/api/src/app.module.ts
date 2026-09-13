import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { AuthService } from "./auth/auth.service";
import { RolesGuard } from "./auth/roles.guard";
import { CatalogController } from "./catalog/catalog.controller";
import { CatalogService } from "./catalog/catalog.service";
import { CatalogCacheService } from "./catalog/catalog-cache.service";
import { ProductSearchService } from "./catalog/product-search.service";
import { CommerceController } from "./commerce/commerce.controller";
import { CommerceService } from "./commerce/commerce.service";
import { OperationsController } from "./operations/operations.controller";
import { OperationsService } from "./operations/operations.service";
import { PrismaService } from "./prisma.service";
import { HealthController } from "./health.controller";
import { IdentityController } from "./platform/identity.controller";
import { IdentityService } from "./platform/identity.service";
import { EmailService } from "./platform/email.service";
import { MediaController } from "./platform/media.controller";
import { MessagingController } from "./platform/messaging.controller";
import { MessagingGateway } from "./platform/messaging.gateway";
import { MessagingService } from "./platform/messaging.service";
import { NotificationController } from "./platform/notification.controller";
import { NotificationService } from "./platform/notification.service";
import { ShippingController } from "./platform/shipping.controller";
import { ShippingService } from "./platform/shipping.service";
import { StorageService } from "./platform/storage.service";

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      },
    ]),
  ],
  controllers: [
    AuthController,
    CatalogController,
    CommerceController,
    OperationsController,
    HealthController,
    MediaController,
    MessagingController,
    NotificationController,
    ShippingController,
    IdentityController,
  ],
  providers: [
    PrismaService,
    AuthService,
    AuthGuard,
    CatalogService,
    CatalogCacheService,
    ProductSearchService,
    CommerceService,
    OperationsService,
    StorageService,
    NotificationService,
    MessagingService,
    MessagingGateway,
    ShippingService,
    IdentityService,
    EmailService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
