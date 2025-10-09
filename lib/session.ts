import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "session_user_id";

export function getSessionUserId() {
  try {
    const c = cookies();
    const id = c.get(COOKIE_NAME)?.value || null;
    return id;
  } catch {
    // Em rotas de API (edge/route), usar from headers cookie
    const h = headers();
    const cookieHeader = h.get("cookie") || "";
    const m = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    return m ? m[1] : null;
  }
}

export async function requireUser() {
  const id = getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true }
  });
  return user;
}

export function clearSessionCookie() {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0
  });
}
