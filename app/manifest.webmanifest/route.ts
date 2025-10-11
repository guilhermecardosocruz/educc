import { NextResponse } from "next/server";

export const dynamic = "force-static"; // permite cache estático em prod

export async function GET() {
  const manifest = {
    name: "EDUCC",
    short_name: "EDUCC",
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#0A66FF",
    description: "App EDUCC",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" }
  });
}
