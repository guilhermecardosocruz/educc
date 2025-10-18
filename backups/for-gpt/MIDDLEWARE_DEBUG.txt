import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Corrige / (auth) /register e / (auth) /recover
  if (path === "/(auth)/register") {
    const url = req.nextUrl.clone();
    url.pathname = "/register";
    return NextResponse.redirect(url);
  }
  if (path === "/(auth)/recover") {
    const url = req.nextUrl.clone();
    url.pathname = "/recover-email";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(auth)/register", "/(auth)/recover"]
};
