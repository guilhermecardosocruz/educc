import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(()=> ({}));
  const token = (body?.token ?? "").toString().trim();
  if (!token) return NextResponse.json({ ok:false, error:"token obrigatório" }, { status: 400 });

  // Reusa o endpoint central de claim
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/share/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // cookies/headers são do mesmo host em runtime; aqui não precisamos body
  });

  const data = await res.json().catch(()=> ({}));
  return NextResponse.json(data, { status: res.status });
}
