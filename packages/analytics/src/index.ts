export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'SEARCH'
  | 'FILTER_USED'
  | 'ADD_TO_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'REVIEW_CREATED'
  | 'COMPARE_PRODUCT'
  | 'WARRANTY_REQUEST'
  | 'RETURN_REQUEST';

export interface AnalyticsEvent {
  name: AnalyticsEventType;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

export interface AnalyticsClient {
  track(event: AnalyticsEventType, properties?: Record<string, unknown>): void;
  page(pageName: string, properties?: Record<string, unknown>): void;
}

class ConsoleAnalyticsClient implements AnalyticsClient {
  track(event: AnalyticsEventType, properties?: Record<string, unknown>): void {
    console.log(`[Analytics Track] 📊 ${event}`, properties);
  }

  page(pageName: string, properties?: Record<string, unknown>): void {
    console.log(`[Analytics PageView] 📄 ${pageName}`, properties);
  }
}

export const analytics: AnalyticsClient = new ConsoleAnalyticsClient();
