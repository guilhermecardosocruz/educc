import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EventPayload = {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  cidade_uf?: string;
  carga_horaria?: string;
  responsavel?: string;
  texto_participante?: string;
  texto_ministrante?: string;
  texto_organizador?: string;
  texto_verso?: string;
  sign1_name?: string; sign1_role?: string;
  sign2_name?: string; sign2_role?: string;
  qr_url?: string;
  autorizacao_texto?: string;
  /** Artes opcionais (fundo/logos) */
  assets?: {
    bg?: { dataUrl: string; mode: "cover" | "contain" | "stretch" };
    logos?: {
      label?: "prefeitura" | "escola" | "brasao" | "outro";
      dataUrl: string;
      position:
        | "top-left" | "top-center" | "top-right"
        | "center-left" | "center" | "center-right"
        | "bottom-left" | "bottom-center" | "bottom-right";
      widthPx: number;
      margin?: number;
    }[];
  };
};

type Student = {
  aluno_nome: string;
  aluno_doc?: string;
  turma?: string;
  carga_horaria?: string;
  observacoes?: string;
};

/* ===== Helpers existentes ===== */
function wrapTextByWidth({ text, font, size, maxWidth }: { text: string; font: PDFFont; size: number; maxWidth: number }): string[] {
  const words = (text || "").trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(t, size) <= maxWidth) {
      line = t;
    } else {
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = "";
        for (const ch of w) {
          const t2 = chunk + ch;
          if (font.widthOfTextAtSize(t2, size) <= maxWidth) chunk = t2;
          else { if (chunk) lines.push(chunk); chunk = ch; }
        }
        line = chunk;
      } else {
        line = w;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}
function drawCenteredText(page: any, text: string, y: number, size: number, font: PDFFont, color = rgb(0,0,0)) {
  const { width } = page.getSize();
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (width - w) / 2, y, size, font, color });
}
function drawRightAlignedText(page: any, text: string, y: number, size: number, font: PDFFont, rightMargin: number, color = rgb(0,0,0)) {
  const { width } = page.getSize();
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: Math.max(0, width - rightMargin - w), y, size, font, color });
}
function formatBR(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ===== NOVOS helpers: artes (fundo/logos) ===== */
async function embedImageFromDataUrl(pdf: PDFDocument, dataUrl: string) {
  const m = dataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) throw new Error("Imagem inválida (use PNG/JPG)");
  const mime = m[1].toLowerCase();
  const b64 = m[3];
  const bytes = Buffer.from(b64, "base64");
  if (mime.includes("png")) return { img: await pdf.embedPng(bytes), type: "png" as const };
  return { img: await pdf.embedJpg(bytes), type: "jpg" as const };
}
function layoutBackground(page: any, img: any, mode: "cover" | "contain" | "stretch") {
  const { width: pw, height: ph } = page.getSize();
  const iw = img.width, ih = img.height;
  if (mode === "stretch") {
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
    return;
  }
  const pr = pw / ph, ir = iw / ih;
  let w = pw, h = ph;
  if (mode === "cover") {
    if (ir > pr) { h = ph; w = h * ir; } else { w = pw; h = w / ir; }
  } else { // contain
    if (ir > pr) { w = pw; h = w / ir; } else { h = ph; w = h * ir; }
  }
  const x = (pw - w) / 2, y = (ph - h) / 2;
  page.drawImage(img, { x, y, width: w, height: h });
}
function placeLogo(page: any, img: any, opt: { position: string; widthPx: number; margin?: number }) {
  const { width: pw, height: ph } = page.getSize();
  const m = Math.max(0, Number(opt.margin ?? 16));
  const w = Math.max(40, Math.min(600, Number(opt.widthPx || 120)));
  const ratio = img.height / img.width;
  const h = w * ratio;
  let x = 0, y = 0;
  const pos = opt.position as string;
  const centerX = (pw - w) / 2, centerY = (ph - h) / 2;
  if (pos === "top-left")        { x = m;           y = ph - h - m; }
  else if (pos === "top-center") { x = centerX;     y = ph - h - m; }
  else if (pos === "top-right")  { x = pw - w - m;  y = ph - h - m; }
  else if (pos === "center-left"){ x = m;           y = centerY; }
  else if (pos === "center")     { x = centerX;     y = centerY; }
  else if (pos === "center-right"){x = pw - w - m;  y = centerY; }
  else if (pos === "bottom-left"){ x = m;           y = m; }
  else if (pos === "bottom-center"){ x = centerX;   y = m; }
  else if (pos === "bottom-right"){ x = pw - w - m; y = m; }
  page.drawImage(img, { x, y, width: w, height: h });
}

/* ===== PDF ===== */
async function buildCertificatesPDF(ev: EventPayload, alunos: Student[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const red = rgb(0.80, 0.00, 0.00);
  const green = rgb(0.00, 0.45, 0.30);
  const gray = rgb(0.25, 0.25, 0.25);

  const s1name = (ev.sign1_name || "VÁGNER ESPÍNDOLA RODRIGUES").toUpperCase();
  const s1role = ev.sign1_role || "Prefeito Municipal";
  const s2name = (ev.sign2_name || "GEÓVANA BENEDET ZANETTE").toUpperCase();
  const s2role = ev.sign2_role || "Secretária Municipal de Educação";

  for (const st of alunos) {
    if (!st?.aluno_nome) continue;

    /* FRENTE */
    const page = pdf.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const margin = 36, left = margin, right = margin;

    // ===== ARTES (opcional; não interfere se ausentes) =====
    try {
      const assets = ev?.assets;
      if (assets?.bg?.dataUrl) {
        const { img } = await embedImageFromDataUrl(pdf, assets.bg.dataUrl);
        layoutBackground(page, img, assets.bg.mode || "cover");
      }
      if (Array.isArray(assets?.logos)) {
        for (const lg of assets.logos) {
          if (!lg?.dataUrl) continue;
          const { img } = await embedImageFromDataUrl(pdf, lg.dataUrl);
          placeLogo(page, img, {
            position: lg.position || "top-right",
            widthPx: lg.widthPx || 120,
            margin: lg.margin,
          });
        }
      }
    } catch {
      // falha em artes não bloqueia a geração
    }

    // moldura e faixas (mantido)
    page.drawRectangle({ x: margin / 2, y: margin / 2, width: width - margin, height: height - margin, borderColor: rgb(0.75,0.75,0.75), borderWidth: 0.8 });
    page.drawRectangle({ x: width - 150, y: height - 48, width: 150, height: 48, color: red });
    page.drawRectangle({ x: width - 105, y: height - 80, width: 105, height: 32, color: green });

    // título
    const spacedTitle = "C E R T I F I C A D O";
    const titleSize = 34;
    const yTopTitle = height - 104;
    drawCenteredText(page, spacedTitle, yTopTitle, titleSize, fontBold, red);

    // nome + CPF
    const yName = yTopTitle - 52;
    const nameLine = [st.aluno_nome.toUpperCase(), st.aluno_doc ? `- ${st.aluno_doc}` : ""].filter(Boolean).join(" ");
    drawCenteredText(page, nameLine, yName, 15, fontBold);

    // área útil para centralizar parágrafo
    const topLimit = yName - 24;
    const bottomLimit = 120;
    const usableHeight = topLimit - bottomLimit;

    // parágrafo
    const inicioBR = formatBR(ev.data_inicio);
    const fimBR = formatBR(ev.data_fim);
    const periodo = (inicioBR || fimBR) ? `${inicioBR ?? ""}${inicioBR && fimBR ? " a " : ""}${fimBR ?? ""}` : "";
    const carga = st.carga_horaria || ev.carga_horaria || "";

    let paragraph = ev.texto_participante?.trim();
    if (paragraph) {
      paragraph = paragraph
        .replace(/\[nome do participante\]/gi, st.aluno_nome)
        .replace(/\[cpf\]/gi, st.aluno_doc || "")
        .replace(/\[carga horária\]/gi, carga);
    } else {
      const partes: string[] = [];
      partes.push(`Certificamos que ${st.aluno_nome} participou do Curso "${(ev.nome || "Curso").toUpperCase()}",`);
      partes.push("promovido e organizado pela Escola Municipal de Governo de Criciúma,");
      if (periodo) partes.push(`realizado no período de ${periodo},`);
      if (carga)  partes.push(`com carga horária de ${carga}.`);
      paragraph = partes.join(" ");
    }

    const contentX = left + 28;
    const contentWidth = width - (contentX + right + 28);
    const bodySize = 12.5, bodyLH = 17;
    const bodyLines = wrapTextByWidth({ text: paragraph, font, size: bodySize, maxWidth: contentWidth });

    const totalBodyHeight = bodyLines.length * bodyLH;
    let y = topLimit - (usableHeight - totalBodyHeight) / 2;

    for (const line of bodyLines) {
      const w = font.widthOfTextAtSize(line, bodySize);
      const x = (width - w) / 2;
      page.drawText(line, { x, y, size: bodySize, font });
      y -= bodyLH;
    }

    // cidade/data à direita
    const dataFormatada = formatBR(ev.data_fim || ev.data_inicio);
    const cidade = ev.cidade_uf?.trim() || ev.local?.trim();
    const linhaData = (cidade && dataFormatada) ? `${cidade}, ${dataFormatada}.` : (dataFormatada ? `${dataFormatada}.` : "");
    if (linhaData) drawRightAlignedText(page, linhaData, bottomLimit + 14 + bodyLH, 12, font, right, gray);

    // assinaturas
    const lineY = 86;
    const cols = [
      { name: (ev.sign1_name ? ev.sign1_name.toUpperCase() : "VÁGNER ESPÍNDOLA RODRIGUES"), role: s1role },
      { name: (ev.sign2_name ? ev.sign2_name.toUpperCase() : "GEÓVANA BENEDET ZANETTE"), role: s2role },
      { name: (st.aluno_nome || "Participante").toUpperCase(), role: "Participante" },
    ];
    const usableWidth = width - left - right;
    const colW = usableWidth / cols.length;
    for (let i = 0; i < cols.length; i++) {
      const x0 = left + i * colW + 16;
      const x1 = left + (i + 1) * colW - 16;
      page.drawLine({ start: { x: x0, y: lineY }, end: { x: x1, y: lineY }, thickness: 1, color: rgb(0,0,0) });
      const cx = (x0 + x1) / 2;
      const n = cols[i].name;
      const r = cols[i].role;
      const ns = 10.5, rs = 9.5;
      page.drawText(n, { x: cx - fontBold.widthOfTextAtSize(n, ns)/2, y: lineY - 15, size: ns, font: fontBold });
      page.drawText(r, { x: cx - font.widthOfTextAtSize(r, rs)/2, y: lineY - 30, size: rs, font });
    }

    /* VERSO */
    const page2 = pdf.addPage([842, 595]);
    const { width: w2, height: h2 } = page2.getSize();
    const m2 = 36, left2 = m2, right2 = m2;
    const contentX2 = left2 + 24;
    const contentW2 = w2 - (contentX2 + right2 + 24);

    page2.drawRectangle({ x: m2 / 2, y: m2 / 2, width: w2 - m2, height: h2 - m2, borderColor: rgb(0.85,0.85,0.85), borderWidth: 0.8 });

    let y2 = h2 - 82;

    if (ev.texto_verso && ev.texto_verso.trim()) {
      page2.drawText("Conteúdo Programático:", { x: contentX2, y: y2, size: 12.5, font: fontBold });
      y2 -= 18;
      const raw = ev.texto_verso.replace(/\s*;\s*$/,"");
      const items = raw.split(";").map(s => s.trim()).filter(Boolean);
      for (const item of items) {
        const line = `• ${item}${item.endsWith(".") ? "" : ";"}`;
        const lines = wrapTextByWidth({ text: line, font, size: 12, maxWidth: contentW2 });
        for (const ln of lines) {
          page2.drawText(ln, { x: contentX2, y: y2, size: 12, font });
          y2 -= 16;
        }
      }
    }

    const qrSize = 120;
    const qrX = left2 + 10;
    const qrY = m2 + 18;
    if (ev.qr_url && ev.qr_url.trim()) {
      const qrPng = await QRCode.toBuffer(ev.qr_url.trim(), { type: "png", width: qrSize, margin: 1 });
      const qrImg = await pdf.embedPng(qrPng);
      page2.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 12, borderColor: red, borderWidth: 1.2 });
      page2.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    }

    const footerBaseY = m2 + 40;
    const totalY = footerBaseY + 16;
    const rightMargin = right2;

    const totalCarga = (st.carga_horaria || ev.carga_horaria || "").trim();
    if (totalCarga) {
      drawRightAlignedText(page2, `TOTAL: ${totalCarga}`, totalY, 12.5, fontBold, rightMargin);
    }
    if (ev.autorizacao_texto && ev.autorizacao_texto.trim()) {
      drawRightAlignedText(page2, ev.autorizacao_texto.trim(), footerBaseY, 12, font, rightMargin);
    }
    if (ev.responsavel && ev.responsavel.trim()) {
      drawRightAlignedText(page2, `Responsável: ${ev.responsavel.trim()}`, footerBaseY - 18, 12, font, rightMargin);
    }
  }

  return await pdf.save();
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const ev: EventPayload = body?.event;
    const alunos: Student[] = body?.students || [];

    if (!ev?.id || ev.id !== params.id) {
      return NextResponse.json({ ok: false, error: "Evento inválido" }, { status: 400 });
    }
    if (!ev?.nome) {
      return NextResponse.json({ ok: false, error: "Nome do evento é obrigatório" }, { status: 400 });
    }
    const validos = Array.isArray(alunos) ? alunos.filter((a) => a?.aluno_nome) : [];
    if (validos.length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum aluno válido fornecido" }, { status: 400 });
    }

    const pdfBytes = await buildCertificatesPDF(ev, validos);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificados-${params.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha ao gerar certificados" }, { status: 500 });
  }
}
