import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";         // 👈 Prisma precisa de Node.js no Vercel
export const dynamic = "force-dynamic";

export default async function ShareClaimPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // precisa estar logado; se não, manda pro login e volta pra cá
  const me = await requireUser();
  if (!me) redirect(`/login?next=/share/${token}`);

  // pegar classId pelo token (necessário pro redirect final)
  const link = await prisma.shareLink.findFirst({
    where: { token, isRevoked: false },
    select: { classId: true },
  });
  if (!link) notFound();

  // efetivar o claim na API
  const res = await fetch(`/api/share/${token}`, { method: "POST", cache: "no-store" });

  if (res.ok) {
    redirect(`/classes/${link.classId}`);
  }
  if (res.status === 409) {
    redirect(`/dashboard?share_error=${encodeURIComponent("Esta turma já possui professor.")}`);
  }
  if (res.status === 404) {
    redirect(`/dashboard?share_error=${encodeURIComponent("Link inválido ou revogado.")}`);
  }
  redirect(`/dashboard?share_error=${encodeURIComponent("Não foi possível entrar pela URL compartilhada.")}`);
}
