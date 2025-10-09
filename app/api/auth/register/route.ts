import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  cpf: z.string().min(11).max(14), // com ou sem máscara; normalizamos
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato YYYY-MM-DD"),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
});

function onlyDigits(s: string) {
  return s.replace(/\D+/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, cpf, birthDate, email, phone } = parsed.data;

    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits.length !== 11) {
      return NextResponse.json(
        { ok: false, error: { message: "CPF inválido" } },
        { status: 400 }
      );
    }

    const phoneDigits = onlyDigits(phone);

    // Converte data (YYYY-MM-DD) para Date em UTC
    const dob = new Date(birthDate + "T00:00:00.000Z");

    // Tenta criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        cpf: cpfDigits,
        birthDate: dob,
        email: email.toLowerCase(),
        phone: phoneDigits,
      },
      select: { id: true, name: true, email: true, cpf: true, phone: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    // Trata violação de unique (cpf/email)
    const msg = (err?.message ?? "").toLowerCase();
    if (msg.includes("unique") || msg.includes("unique constraint")) {
      return NextResponse.json(
        { ok: false, error: { message: "CPF ou e-mail já cadastrado" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: { message: "Erro ao criar usuário" } },
      { status: 500 }
    );
  }
}
