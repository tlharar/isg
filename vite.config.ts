import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@domains': path.resolve(__dirname, './src/domains'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@shell': path.resolve(__dirname, './src/shell'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/dates'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
});
