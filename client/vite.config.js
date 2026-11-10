import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@mediapipe\/pose$/,
        replacement: path.resolve(import.meta.dirname, 'src/utils/mediapipePoseShim.js'),
      },
    ],
  },
  optimizeDeps: {
    include: ['@tensorflow-models/pose-detection', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
