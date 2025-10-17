import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getGroupAttendanceSummary } from "@/lib/analytics/attendance";

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const groupId = params.groupId;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return NextResponse.json({ ok: false, error: "missing from/to" }, { status: 400 });

    // (Opcional) checar se usuário tem acesso ao grupo
    const group = await prisma.classGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });
    if (!group) return NextResponse.json({ ok: false, error: "group not found" }, { status: 404 });

    const summaries = await getGroupAttendanceSummary(groupId, from, to);
    return NextResponse.json({ ok: true, group: { id: group.id, name: group.name }, summaries });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
