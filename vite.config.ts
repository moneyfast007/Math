import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Build configuration.
 *
 * Privacy posture: the app ships no analytics, no external fonts, no CDN.
 * Everything the browser loads comes from this origin (see public/_headers for the CSP
 * that enforces it).
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Audio is large and grade-specific; it is cached at runtime, per grade,
      // not precached in bulk (see src/audio/ in a later phase).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // The per-grade clip lists change with every new world: the network first.
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/index/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'audio-index-v1',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // A clip never changes (its name is the hash of its text): the cache first.
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-v2',
              // Room for two grades downloaded for offline use on one device.
              expiration: { maxEntries: 30000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'פלוסי',
        short_name: 'פלוסי',
        description: 'תרגול מתמטיקה לילדים, מגן חובה ועד כיתה ו׳',
        lang: 'he',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#FFF8EE',
        theme_color: '#FFF8EE',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
