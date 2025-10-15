import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = (body?.token ?? "").toString().trim();
  if (!token) return NextResponse.json({ ok: false, error: "token obrigatório" }, { status: 400 });
  const res = await fetch(`/api/share/${token}`, { method: "POST", headers: { "content-type": "application/json" }, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
