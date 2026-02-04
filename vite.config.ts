import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/assets'),
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
    // EKLENDİ 1: Uyarı limitini 1.5MB'a çekiyoruz (Sarı uyarıyı kaldırır)
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      output: {
        // GÜNCELLENDİ: Projedeki ağır kütüphaneleri ayrı dosyalara bölüyoruz
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/dates', '@mantine/notifications'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          // Projeye özgü yeni eklemeler:
          icons: ['@tabler/icons-react'], // En çok yer kaplayan paketlerden biri
          charts: ['recharts'],           // Dashboard grafikleri için
          state: ['zustand'],             // Store yönetimi için
          utils: ['dayjs'],               // Tarih formatlama için
        },
      },
    },
  },
});