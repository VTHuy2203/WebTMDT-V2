import { getAppConfig } from '@marketplace/config';
import type {
  IProductApi,
  ICartApi,
  ICheckoutApi,
  IPaymentApi,
  IOrderApi,
  IWarrantyApi,
  ISellerApi,
  IAdminApi,
  IAuthApi,
  IGameAccountApi,
  IGameAccountInventoryApi,
  IDigitalDeliveryApi,
  IDigitalDisputeApi,
  IAppAccountApi,
  IAppAccountInventoryApi,
  IAppOrderApi,
  IShopApi,
} from './contracts';

import {
  MockProductRepository,
  MockCartRepository,
  MockCheckoutRepository,
  MockPaymentRepository,
  MockOrderRepository,
  MockWarrantyRepository,
  MockSellerRepository,
  MockShopRepository,
  MockAdminRepository,
  MockAuthRepository,
  MockGameAccountRepository,
  MockGameAccountInventoryRepository,
  MockDigitalDeliveryRepository,
  MockDigitalDisputeRepository,
  MockAppAccountRepository,
  MockAppAccountInventoryRepository,
  MockAppOrderRepository,
} from './mocks/mockRepository';

import {
  HttpProductRepository,
  HttpCartRepository,
  HttpCheckoutRepository,
  HttpPaymentRepository,
  HttpOrderRepository,
  HttpWarrantyRepository,
  HttpSellerRepository,
  HttpShopRepository,
  HttpAdminRepository,
  HttpAuthRepository,
  HttpGameAccountRepository,
  HttpGameAccountInventoryRepository,
  HttpDigitalDeliveryRepository,
  HttpDigitalDisputeRepository,
  HttpAppAccountRepository,
  HttpAppAccountInventoryRepository,
  HttpAppOrderRepository,
} from './httpRepository';

export * from './contracts';
export * from './http';
export * from './mocks/fixtures';

// Factory to resolve adapters based on environment setting (Section 82 & P0.1)
const config = getAppConfig();
const isHttpMode = config.apiMode === 'http';

export const productApi: IProductApi = isHttpMode ? new HttpProductRepository() : new MockProductRepository();
export const cartApi: ICartApi = isHttpMode ? new HttpCartRepository() : new MockCartRepository();
export const checkoutApi: ICheckoutApi = isHttpMode ? new HttpCheckoutRepository() : new MockCheckoutRepository();
export const paymentApi: IPaymentApi = isHttpMode ? new HttpPaymentRepository() : new MockPaymentRepository();
export const orderApi: IOrderApi = isHttpMode ? new HttpOrderRepository() : new MockOrderRepository();
export const warrantyApi: IWarrantyApi = isHttpMode ? new HttpWarrantyRepository() : new MockWarrantyRepository();
export const sellerApi: ISellerApi = isHttpMode ? new HttpSellerRepository() : new MockSellerRepository();
export const shopApi: IShopApi = isHttpMode ? new HttpShopRepository() : new MockShopRepository();
export const adminApi: IAdminApi = isHttpMode ? new HttpAdminRepository() : new MockAdminRepository();
export const authApi: IAuthApi = isHttpMode ? new HttpAuthRepository() : new MockAuthRepository();

export const gameAccountApi: IGameAccountApi = isHttpMode ? new HttpGameAccountRepository() : new MockGameAccountRepository();
export const gameInventoryApi: IGameAccountInventoryApi = isHttpMode ? new HttpGameAccountInventoryRepository() : new MockGameAccountInventoryRepository();
export const digitalDeliveryApi: IDigitalDeliveryApi = isHttpMode ? new HttpDigitalDeliveryRepository() : new MockDigitalDeliveryRepository();
export const digitalDisputeApi: IDigitalDisputeApi = isHttpMode ? new HttpDigitalDisputeRepository() : new MockDigitalDisputeRepository();

export const appAccountApi: IAppAccountApi = isHttpMode ? new HttpAppAccountRepository() : new MockAppAccountRepository();
export const appInventoryApi: IAppAccountInventoryApi = isHttpMode ? new HttpAppAccountInventoryRepository() : new MockAppAccountInventoryRepository();
export const appOrderApi: IAppOrderApi = isHttpMode ? new HttpAppOrderRepository() : new MockAppOrderRepository();

