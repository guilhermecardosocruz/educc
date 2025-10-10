import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json().catch(() => ({}));
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Defina OPENAI_API_KEY para habilitar geração de imagem." }, { status: 501 });
    }
    if (!prompt || String(prompt).trim().length === 0) {
      return NextResponse.json({ error: "Prompt inválido." }, { status: 400 });
    }

    // Exemplo com Images API (ajuste o endpoint/modelo conforme sua conta)
    const body = {
      model: "gpt-image-1",
      prompt: String(prompt),
      size: "1024x1024"
    };

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data: any = await r.json().catch(() => ({}));
    if (!r.ok || !data?.data?.[0]?.url) {
      return NextResponse.json({ error: data?.error?.message || "Falha ao gerar imagem" }, { status: 500 });
    }
    return NextResponse.json({ url: data.data[0].url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno" }, { status: 500 });
  }
}
