import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const COOKIE_NAME = "session_user_id";

function loginLog(
  requestId: string,
  step: string,
  details?: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      scope: "auth-login",
      requestId,
      step,
      timestamp: new Date().toISOString(),
      ...details,
    })
  );
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  loginLog(requestId, "request_started", {
    nodeVersion: process.version,
    region: process.env.VERCEL_REGION ?? null,
  });

  try {
    loginLog(requestId, "body_read_started");

    const body = await req.json().catch(() => ({}));

    loginLog(requestId, "body_read_finished");

    const parsed = schema.safeParse(body);

    loginLog(requestId, "validation_finished", {
      success: parsed.success,
    });

    if (!parsed.success) {
      loginLog(requestId, "validation_failed", {
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.flatten(),
          requestId,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    loginLog(requestId, "prisma_query_started");

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    loginLog(requestId, "prisma_query_finished", {
      userFound: Boolean(user),
      passwordHashFound: Boolean(user?.passwordHash),
    });

    if (!user || !user.passwordHash) {
      loginLog(requestId, "credentials_rejected_before_bcrypt", {
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Credenciais inválidas",
          requestId,
        },
        { status: 401 }
      );
    }

    loginLog(requestId, "bcrypt_compare_started");

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    loginLog(requestId, "bcrypt_compare_finished", {
      passwordMatches,
    });

    if (!passwordMatches) {
      loginLog(requestId, "credentials_rejected_after_bcrypt", {
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Credenciais inválidas",
          requestId,
        },
        { status: 401 }
      );
    }

    loginLog(requestId, "cookie_started");

    const cookieStore = await cookies();

    cookieStore.set({
      name: COOKIE_NAME,
      value: user.id,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    loginLog(requestId, "cookie_finished");

    loginLog(requestId, "login_succeeded", {
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    const stack = error instanceof Error ? error.stack : undefined;

    console.error(
      JSON.stringify({
        scope: "auth-login",
        requestId,
        step: "request_failed",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        message,
        stack,
      })
    );

    return NextResponse.json(
      {
        ok: false,
        error: message,
        requestId,
      },
      { status: 500 }
    );
  }
}
