import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "node:crypto";
import { sendRecoveryEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=> ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true }
    });

    // Não expomos existência do e-mail; mas só criamos token se existir.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutos

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: expires }
      });

      const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
      const link = `${base}/reset/${token}`;

      const firstName = (user.name || "").split(" ")[0] || "Olá";
      const subject = "Recuperação de conta • EDUCC";
      const text =
`${firstName}, recebemos um pedido para recuperar sua conta EDUCC.
Abra este link em até 10 min: ${link}

Se não foi você, ignore este e-mail.`;
      const html =
`<p>${firstName}, recebemos um pedido para recuperar sua conta <b>EDUCC</b>.</p>
<p>Abra este link em até <b>10 min</b>: <a href="${link}">${link}</a></p>
<p>Se não foi você, ignore esta mensagem.</p>`;

      // Só envia se EMAIL_PROVIDER_ENABLED=true; senão, fica "no-op"
      await sendRecoveryEmail(email, subject, text, html);
    }

    // Sempre OK para não permitir enumeração de e-mails
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: { message: err?.message ?? "Erro" } }, { status: 500 });
  }
}
