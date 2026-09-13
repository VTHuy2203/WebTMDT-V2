export interface FeatureFlags {
  ENABLE_CHAT: boolean;
  ENABLE_AI_SEARCH: boolean;
  ENABLE_COMPARE: boolean;
  ENABLE_NEW_CHECKOUT: boolean;
  ENABLE_WARRANTY: boolean;
  ENABLE_SELLER_REGISTRATION: boolean;
  ENABLE_REVIEWS: boolean;
  ENABLE_GAME_ACCOUNT_MARKETPLACE: boolean;
  ENABLE_APP_ACCOUNT_MARKETPLACE: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  ENABLE_CHAT: true,
  ENABLE_AI_SEARCH: true,
  ENABLE_COMPARE: true,
  ENABLE_NEW_CHECKOUT: true,
  ENABLE_WARRANTY: true,
  ENABLE_SELLER_REGISTRATION: true,
  ENABLE_REVIEWS: true,
  ENABLE_GAME_ACCOUNT_MARKETPLACE: true,
  ENABLE_APP_ACCOUNT_MARKETPLACE: true,
};

export interface AppConfig {
  apiBaseUrl: string;
  apiMode: 'mock' | 'http';
  appEnv: 'development' | 'staging' | 'production';
  cdnUrl: string;
  sellerUrl: string;
  adminUrl: string;
  sepay: {
    displayName: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  features: FeatureFlags;
}

function getEnvVar(viteKey: string, nextKey: string, fallback: string): string {
  try {
    // 1. Check import.meta.env (standard Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta?.env) {
      // @ts-ignore
      if (import.meta.env[viteKey] !== undefined) return import.meta.env[viteKey];
      // @ts-ignore
      if (import.meta.env[nextKey] !== undefined) return import.meta.env[nextKey];
    }
  } catch {
    // ignore
  }
  try {
    // 2. Check process.env (Node / SSR / Tests)
    if (typeof process !== 'undefined' && process?.env) {
      if (process.env[viteKey] !== undefined) return process.env[viteKey]!;
      if (process.env[nextKey] !== undefined) return process.env[nextKey]!;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const getAppConfig = (): AppConfig => {
  const appEnv = getEnvVar('VITE_APP_ENV', 'NEXT_PUBLIC_APP_ENV', 'development') as 'development' | 'staging' | 'production';
  const apiMode = getEnvVar('VITE_API_MODE', 'NEXT_PUBLIC_API_MODE', 'mock') as 'mock' | 'http';
  const apiBaseUrl = getEnvVar('VITE_API_BASE_URL', 'NEXT_PUBLIC_API_BASE_URL', 'https://api.marketplace.local/v1');
  const cdnUrl = getEnvVar('VITE_CDN_URL', 'NEXT_PUBLIC_CDN_URL', 'https://cdn.marketplace.local');

  // P0.2 Safety Check: Warn if production builds are silently running on mock mode or default local URLs
  if (appEnv === 'production') {
    if (apiMode === 'mock') {
      console.warn('[SECURITY/CONFIG WARNING] Application is running in PRODUCTION environment but VITE_API_MODE is set to MOCK.');
    }
    if (apiBaseUrl.includes('marketplace.local')) {
      console.warn('[SECURITY/CONFIG WARNING] VITE_API_BASE_URL is pointing to local domain (api.marketplace.local) in PRODUCTION.');
    }
  }

  return {
    apiBaseUrl,
    apiMode,
    appEnv,
    cdnUrl,
    sellerUrl: getEnvVar('VITE_SELLER_URL', 'NEXT_PUBLIC_SELLER_URL', 'http://localhost:3001'),
    adminUrl: getEnvVar('VITE_ADMIN_URL', 'NEXT_PUBLIC_ADMIN_URL', 'http://localhost:3002'),
    sepay: {
      displayName: getEnvVar('VITE_SEPAY_DISPLAY_NAME', 'NEXT_PUBLIC_SEPAY_DISPLAY_NAME', 'MARKETPLACE VIETNAM'),
      bankName: getEnvVar('VITE_SEPAY_BANK_NAME', 'NEXT_PUBLIC_SEPAY_BANK_NAME', 'MBBank (Ngân hàng Quân Đội)'),
      accountNumber: getEnvVar('VITE_SEPAY_ACC_NUMBER', 'NEXT_PUBLIC_SEPAY_ACC_NUMBER', '09876543210'),
      accountHolder: getEnvVar('VITE_SEPAY_ACC_NAME', 'NEXT_PUBLIC_SEPAY_ACC_NAME', 'CONG TY CO PHAN CONG NGHE MARKETPLACE'),
    },
    features: defaultFeatureFlags,
  };
};

export const appConfig: AppConfig = getAppConfig();
