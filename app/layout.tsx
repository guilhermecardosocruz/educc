import "./globals.css";
export { metadata, viewport } from "./metadata";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR"><head><link rel="manifest" href="/manifest.webmanifest" /></head><body>{children}</body>
    </html>
  );
}
