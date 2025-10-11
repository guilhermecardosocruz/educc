import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "EDUCC",
  description: "App EDUCC",
  applicationName: "EDUCC",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: "/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EDUCC"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A66FF"
};
