import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ClassRole } from "@prisma/client";

const COOKIE_NAME = "session_user_id";

/** Lê o userId do cookie (async em Next 15) */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const c = await cookies();
    const id = c.get(COOKIE_NAME)?.value || null;
    return id;
  } catch {
    // Fallback para contexts onde cookies() não está disponível
    const h = await headers();
    const cookieHeader = h.get("cookie") || "";
    const m = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    return m ? m[1] : null;
  }
}

/** Busca o usuário logado; retorna null se não houver */
export async function requireUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true }
  });
  return user;
}

/** Apaga o cookie de sessão (async em Next 15) */
export async function clearSessionCookie() {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0
  });
}

// === Access helpers (ClassAccess) ============================================

/**
 * Retorna o papel do usuário na turma (PROFESSOR | GESTOR) ou null se não tem acesso.
 */
export async function getRole(userId: string, classId: string): Promise<ClassRole | null> {
  try {
    const row = await prisma.classAccess.findFirst({
      where: { classId, userId },
      select: { role: true },
    });
    return row?.role ?? null;
  } catch (_e) {
    return null;
  }
}

/** Versão que usa o usuário logado da sessão atual. */
export async function getMyRole(classId: string): Promise<ClassRole | null> {
  const me = await requireUser();
  if (!me) return null;
  return getRole(me.id, classId);
}

/** Açúcares para checagens rápidas na UI/rota. */
export function roleFlags(role: ClassRole | null) {
  return {
    isProfessor: role === "PROFESSOR",
    isGestor: role === "GESTOR",
    hasAccess: role === "PROFESSOR" || role === "GESTOR",
  };
}
