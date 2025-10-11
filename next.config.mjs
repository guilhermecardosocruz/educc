// next.config.mjs — PWA habilitado em produção
import withPWA from 'next-pwa';

const isDev = process.env.NODE_ENV !== 'production';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev,
  fallbacks: { document: '/offline' },
  // Ajustes finos de cache (opcional)
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } }
    },
    {
      urlPattern: ({ request }) => ['style','script','font'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'assets' }
    }
  ]
})({
  // Outras opções do projeto (se precisar)
});
