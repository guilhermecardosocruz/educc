import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["lucide-react"] },
  eslint: { ignoreDuringBuilds: true }, // silencia aviso do ESLint no build
};

export default withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  skipWaiting: true,
  scope: "/",
  sw: "sw.js",
})(baseConfig);
