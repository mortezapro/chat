import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true
  },
  optimizeDeps: {
    include: ['simple-peer'],
    exclude: ['events', 'util']
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});

