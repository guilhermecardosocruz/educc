import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  name: z.string().min(2),
  cpf: z.string().min(11),
  birthDate: z.string(), // ISO yyyy-mm-dd
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8)
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
});

function onlyDigits(s: string){ return s.replace(/\D+/g, ""); }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, cpf, birthDate, email, phone, password } = parsed.data;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { cpf: onlyDigits(cpf) }] },
      select: { id: true }
    });
    if (exists) {
      return NextResponse.json({ ok:false, error: "E-mail ou CPF já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        cpf: onlyDigits(cpf),
        birthDate: new Date(birthDate),
        email: email.toLowerCase(),
        phone: onlyDigits(phone),
        passwordHash
      },
      select: { id: true, name: true, email: true }
    });

    // (opcional) já poderíamos criar sessão aqui — vou deixar a autenticação no /login
    return NextResponse.json({ ok:true, user }, { status: 201 });
  } catch (err:any) {
    return NextResponse.json({ ok:false, error: err?.message ?? "Erro" }, { status: 500 });
  }
}
