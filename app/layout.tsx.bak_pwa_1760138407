import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDUCC",
  description: "Sua plataforma educacional — PWA",
  manifest: "/manifest.json",
  applicationName: "EDUCC"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900 antialiased">
        {isDev && (
          <Script id="dev-sw-killer" strategy="beforeInteractive">
            {`
              (function(){
                if (typeof window === 'undefined') return;
                // Unregister todos os SW (roda antes da hidratação)
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations()
                    .then(regs => regs.forEach(r => r.unregister().catch(()=>{})))
                    .catch(()=>{});
                }
                // Limpa caches registrados (Workbox / next-pwa)
                if ('caches' in window) {
                  caches.keys()
                    .then(keys => keys.forEach(k => caches.delete(k).catch(()=>{})))
                    .catch(()=>{});
                }
              })();
            `}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
