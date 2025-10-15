import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import * as XLSX from "xlsx";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const buffer = await req.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const students = rows.slice(1).map((row) => {
    const map: Record<string,string> = {};
    sheet["!ref"]?.split(":").forEach((cell, idx) => {
      const header = (rows[0][idx] ?? "").toString().trim().toLowerCase();
      if (header) map[header] = (row[idx] ?? "").toString().trim();
    });
    const r: any = {};
    r.name = (map["name"] ?? map["nome"] ?? "").toString().trim();
    r.cpf = (map["cpf"] ?? "").toString().trim();
    r.contact = (map["contact"] ?? map["contato"] ?? map["telefone"] ?? map["whatsapp"] ?? "").toString().trim();
    return r;
  });

  if (!students.length) {
    return NextResponse.json({ ok:false, error:"Nenhum aluno encontrado" }, { status:400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const s of students) {
      if (!s.name) continue;
      await tx.student.create({
        data: {
          classId: id,
          name: s.name,
          cpf: s.cpf || null,
          contact: s.contact || null,
        },
      });
    }
  });

  return NextResponse.json({ ok:true, count: students.length });
}
