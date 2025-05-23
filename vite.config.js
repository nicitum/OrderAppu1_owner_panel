import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/oms1/', // Add this line to set the base URL
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});