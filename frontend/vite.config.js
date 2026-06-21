import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      '13.233.114.105'
    ],
    proxy: {
      '/api': {
        target: 'http://13.233.114.105',
        changeOrigin: true,
      },
    },
  },
});
