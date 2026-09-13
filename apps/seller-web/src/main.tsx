import './sentry';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div role="alert">Đã xảy ra lỗi. Vui lòng tải lại trang.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
