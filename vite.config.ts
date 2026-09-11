/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { fileURLToPath } from 'node:url'

const rootDir = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/assets/**', '**/dist/**', '**/*.mp4'],
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        catalogo: resolve(rootDir, 'catalogo.html'),
        servicios: resolve(rootDir, 'servicios.html'),
        avisos: resolve(rootDir, 'avisos.html'),
        empleo: resolve(rootDir, 'empleo.html'),
        contacto: resolve(rootDir, 'contacto.html'),
        privacidad: resolve(rootDir, 'privacidad.html'),
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
