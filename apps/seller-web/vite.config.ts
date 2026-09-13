import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@marketplace/types': path.resolve(import.meta.dirname, '../../packages/types/src/index.ts'),
      '@marketplace/config': path.resolve(import.meta.dirname, '../../packages/config/src/index.ts'),
      '@marketplace/utils': path.resolve(import.meta.dirname, '../../packages/utils/src/index.ts'),
      '@marketplace/validation': path.resolve(import.meta.dirname, '../../packages/validation/src/index.ts'),
      '@marketplace/ui': path.resolve(import.meta.dirname, '../../packages/ui/src/index.ts'),
      '@marketplace/auth': path.resolve(import.meta.dirname, '../../packages/auth/src/index.ts'),
      '@marketplace/analytics': path.resolve(import.meta.dirname, '../../packages/analytics/src/index.ts'),
      '@marketplace/api-client': path.resolve(import.meta.dirname, '../../packages/api-client/src/index.ts'),
    },
  },
  server: {
    port: 3001,
  },
});
