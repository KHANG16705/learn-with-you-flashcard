import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cấu hình Vite chạy giao diện ở cổng 5173
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
