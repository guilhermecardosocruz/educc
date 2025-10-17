export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getGroupAttendanceSummary } from "@/lib/analytics/attendance";
import { buildGroupReportPDF } from "@/lib/report/pdf";

export async function HEAD(_req: Request, { params }: { params: { groupId: string } }) {
  // HEAD “saudável” para Vercel/Next
  return new Response(null, { status: 204 });
}

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  try {
    const me = await requireUser();
    if (!me) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const groupId = params.groupId;
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) {
      return new Response(JSON.stringify({ ok: false, error: "missing from/to" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // grupo do usuário (mesma regra das rotas existentes)
    const g = await prisma.group.findFirst({
      where: { id: groupId, userId: me.id },
      select: { id: true, name: true },
    });
    if (!g) {
      return new Response(JSON.stringify({ ok: false, error: "group not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const summaries = await getGroupAttendanceSummary(g.id, from, to);
    const pdf = await buildGroupReportPDF({ groupName: g.name, from, to, summaries });

    return new Response(pdf, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="relatorio-grupo-${g.id}-${from}_a_${to}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
