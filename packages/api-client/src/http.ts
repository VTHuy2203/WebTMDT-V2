import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAppConfig } from '@marketplace/config';
import type { ApiError } from '@marketplace/types';

const config = getAppConfig();

function clientApp(): 'buyer' | 'seller' | 'admin' {
  try {
    // @ts-ignore Vite injects this value independently for each portal.
    const configured = String(import.meta.env?.VITE_CLIENT_APP ?? '').toLowerCase();
    if (configured === 'seller' || configured === 'admin' || configured === 'buyer') return configured;
  } catch {
    // Fall back to the local port/subdomain for older environment files.
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '3002' || window.location.hostname.startsWith('admin.')) return 'admin';
    if (window.location.port === '3001' || window.location.hostname.startsWith('seller.')) return 'seller';
  }
  return 'buyer';
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-App': clientApp(),
  },
});

// Request interceptor to attach bearer token
httpClient.interceptors.request.use(
  (reqConfig) => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('marketplace-auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed.state?.token) {
            reqConfig.headers.Authorization = `Bearer ${parsed.state.token}`;
          }
        } catch {
          // ignore parse error
        }
      }
    }
    // Generate unique Request ID
    reqConfig.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize error into ApiError
let refreshPromise: Promise<string> | null = null;

function tokenSubject(token: string): string | null {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function persistAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('marketplace-auth-storage');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const expectedUserId = parsed.state?.user?.id;
    const refreshedUserId = tokenSubject(token);
    if (expectedUserId && refreshedUserId && expectedUserId !== refreshedUserId) {
      throw new Error('Refreshed session belongs to another portal account');
    }
    if (parsed.state) parsed.state.token = token;
    localStorage.setItem('marketplace-auth-storage', JSON.stringify(parsed));
  } catch (error) {
    if (error instanceof Error && error.message.includes('another portal account')) throw error;
    // Ignore corrupted client storage; the application will request login again.
  }
}

function clearStaleSession() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('marketplace-auth-storage');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    parsed.state = {
      ...parsed.state,
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
    localStorage.setItem('marketplace-auth-storage', JSON.stringify(parsed));
  } catch {
    localStorage.removeItem('marketplace-auth-storage');
  }
}

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ error?: ApiError; message?: string }>) => {
    const request = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = request?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && request && !request._retried && !isAuthRoute) {
      request._retried = true;
      refreshPromise ??= axios
        .post(`${config.apiBaseUrl}/auth/refresh`, {}, {
          withCredentials: true,
          headers: { 'X-Client-App': clientApp() },
        })
        .then((response) => {
          const token = response.data?.data?.accessToken as string;
          if (!token) throw new Error('Refresh response did not contain an access token');
          persistAccessToken(token);
          return token;
        })
        .finally(() => {
          refreshPromise = null;
        });
      try {
        const token = await refreshPromise;
        request.headers = { ...request.headers, Authorization: `Bearer ${token}` } as any;
        return httpClient.request(request);
      } catch {
        clearStaleSession();
        // Continue into normalized unauthorized error below.
      }
    }
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || error.code || 'UNKNOWN_ERROR',
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Đã có lỗi xảy ra từ máy chủ',
      details: error.response?.data?.error?.details || {},
    };
    return Promise.reject(apiError);
  }
);
