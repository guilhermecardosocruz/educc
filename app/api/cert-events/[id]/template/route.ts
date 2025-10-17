import { NextResponse } from "next/server";
import { buildStudentsTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string }}) {
  const wb = buildStudentsTemplateWorkbook();
  const buf = workbookToBuffer(wb);
  const fileName = `cert-event-${params.id}-alunos.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
