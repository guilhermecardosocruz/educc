import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const schema = z.object({
  emailOrCpf: z.string().min(3),
  password: z.string().min(8)
});

const COOKIE_NAME = "session_user_id";

function onlyDigits(s: string){ return s.replace(/\D+/g, ""); }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { emailOrCpf, password } = parsed.data;

    const byEmail = emailOrCpf.includes("@");
    const where = byEmail
      ? { email: emailOrCpf.toLowerCase() }
      : { cpf: onlyDigits(emailOrCpf) };

    const user = await prisma.user.findUnique({
      where,
      select: { id: true, name: true, email: true, passwordHash: true }
    });

    // resposta genérica para não dar dica
    const invalid = NextResponse.json({ ok:false, error: "Credenciais inválidas" }, { status: 401 });

    if (!user || !user.passwordHash) return invalid;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid;

    const c = await cookies();
    // cookie simples; se quiser, migramos para JWT com expiração/refresh
    c.set({
      name: COOKIE_NAME,
      value: user.id,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // sem maxAge => cookie de sessão; podemos colocar expiração se preferir
    });

    return NextResponse.json({ ok:true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err:any) {
    return NextResponse.json({ ok:false, error: err?.message ?? "Erro" }, { status: 500 });
  }
}
