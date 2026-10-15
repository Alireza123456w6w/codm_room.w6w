import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://codm-room.4-k5bbin1ys6uuriq0ud2nrhdph4-p.workers.dev',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
