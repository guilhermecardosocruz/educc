import { Suspense } from "react";
import LoginCard from "@/components/LoginCard";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <Suspense fallback={<div className="text-sm text-gray-600">Carregando…</div>}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
