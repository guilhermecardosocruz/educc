import { NextResponse } from "next/server";

export function GET() {
  const manifest = {
    name: "EDUCC",
    short_name: "EDUCC",
    description: "Gestão de turmas, chamadas e conteúdos — instalável.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#0A66FF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };
  return NextResponse.json(manifest);
}
