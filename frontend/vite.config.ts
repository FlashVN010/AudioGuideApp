import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Cho phép truy cập qua tunnel (ngrok, cloudflared...) khi test với
    // nhiều thiết bị ở mạng khác nhau. Vite mặc định chặn host lạ để
    // chống DNS rebinding attack, nên cần khai báo rõ domain được phép.
    // Ngrok cấp domain với nhiều đuôi khác nhau tùy thời điểm/tài khoản
    // (.ngrok-free.app, .ngrok-free.dev, .ngrok.app, .ngrok.dev), nên cần
    // liệt kê đủ để không bị chặn nhầm khi domain đổi đuôi.
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.ngrok.app',
      '.ngrok.dev',
      '.trycloudflare.com',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5011',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://127.0.0.1:5011',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://127.0.0.1:5011',
        changeOrigin: true,
      },
      '/qrcodes': {
        target: 'http://127.0.0.1:5011',
        changeOrigin: true,
      },
    },
  },
});