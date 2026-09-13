/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { fileURLToPath } from 'node:url'

const rootDir = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url))

function orderWebsocketPlugin() {
  let wss: any = null;
  return {
    name: 'order-websocket-server',
    configureServer(server: any) {
      if (process.env.VITEST) return;
      import('ws').then(({ WebSocketServer, WebSocket }) => {
        try {
          wss = new WebSocketServer({ port: 5174 });
          wss.on('error', (err: any) => {
            // Port 5174 might already be bound by background dev server or standalone ws-server
            console.log('[order-ws] Port 5174 info:', err.message);
          });
          wss.on('connection', (ws: any) => {
            ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSockets Supermercado Osos Live', timestamp: new Date().toISOString() }));
            ws.on('message', (message: any) => {
              const data = message.toString();
              for (const client of wss.clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(data);
                }
              }
            });
          });
          server.httpServer?.on('close', () => {
            wss?.close();
          });
        } catch {
          // Port may already be in use
        }
      }).catch(() => {});
    },
  };
}

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
        admin: resolve(rootDir, 'admin.html'),
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    orderWebsocketPlugin(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
