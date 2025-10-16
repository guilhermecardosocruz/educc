import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const runtimeCaching = [
  { urlPattern: ({ request }) => request.mode === "navigate",
    handler: "NetworkFirst",
    options: { cacheName: "pages", expiration: { maxEntries: 50, maxAgeSeconds: 7*24*3600 } } },
  { urlPattern: /_next\/static\/.*/i,
    handler: "StaleWhileRevalidate",
    options: { cacheName: "next-static" } },
  { urlPattern: /\/icons\/.*\.png$/i,
    handler: "CacheFirst",
    options: { cacheName: "icons", expiration: { maxEntries: 16 } } },
  { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
    handler: "StaleWhileRevalidate",
    options: { cacheName: "images" } },
  { urlPattern: /\/api\/.*/i,
    handler: "NetworkFirst",
    options: { cacheName: "api", networkTimeoutSeconds: 3 } }
];

// ⬇️ eslint deve ficar aqui (fora do withPWA)
const baseConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true }
};

export default withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  skipWaiting: true,
  runtimeCaching,
  fallbacks: { document: "/offline" }
})(baseConfig);
