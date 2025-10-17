import { NextResponse } from "next/server";
import { parseStudentsFromArrayBuffer } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "Arquivo não enviado" }, { status: 400 });
    }
    const ab = await file.arrayBuffer();
    const alunos = await parseStudentsFromArrayBuffer(ab);
    if (alunos.length === 0) {
      return NextResponse.json({ ok: false, error: "Planilha sem alunos válidos (aluno_nome obrigatório)" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, alunos, eventId: params.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha ao processar planilha" }, { status: 500 });
  }
}
