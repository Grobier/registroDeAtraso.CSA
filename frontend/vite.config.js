import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 👇 Se importa esto
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  base: './', // <-- Asegura rutas relativas correctas para producción en backend
  plugins: [
    react(),
    createHtmlPlugin() // 👈 Asegura carga del HTML correctamente
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  // 👇 Agrega esta sección
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
