import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id },
    select: { id: true, name: true }
  });
  if (!cls) return notFound();

  return (
    <main className="min-h-screen">
      {/* Cabeçalho */}
      <section className="bg-gradient-to-br from-[#0A66FF]/90 to-[#0A66FF] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-3">
          <Link
            href={`/dashboard`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            Voltar
          </Link>

          <div className="text-right">
            <h1 className="text-xl font-semibold">
              Turma — <span className="opacity-95">{cls.name}</span>
            </h1>
            <p className="mt-1 text-sm opacity-90">Gerencie a turma acessando Chamadas e Conteúdos.</p>
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Ações</h2>
          <p className="text-gray-600 mb-4">Use os atalhos abaixo para gerenciar a turma.</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/classes/${cls.id}/chamadas`}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              Ir para Chamadas
            </Link>
            <Link
              href={`/classes/${cls.id}/conteudos`}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
            >
              Ver Conteúdos
            </Link>

            {/* 🔹 Botão de Relatório (PDF) - abre modal e gera PDF com jsPDF (CDN) */}
            <button
              id="btn-report-attendance"
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
              title="Gerar relatório de presenças (PDF) por período"
              data-class-id={cls.id}
              data-class-name={cls.name}
            >
              Relatório (PDF)
            </button>
          </div>
        </div>
      </section>

      {/* 🔸 Modal simples */}
      <dialog id="dlg-report" className="rounded-2xl p-0 w-full max-w-md backdrop:bg-black/30">
        <form method="dialog" className="rounded-2xl border bg-white shadow-soft p-5">
          <h3 className="text-lg font-semibold text-gray-900">Relatório de Chamadas (PDF)</h3>
          <p className="text-sm text-gray-600 mt-1">Escolha o período para consolidar presenças.</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Início</span>
              <input id="inp-start" type="date" className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Fim</span>
              <input id="inp-end" type="date" className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel" className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-700">Cancelar</button>
            <button type="button" id="btn-generate" className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90">
              Gerar PDF
            </button>
          </div>
        </form>
      </dialog>

      {/* 🔸 Script client-side: carrega jsPDF via CDN e gera PDF */}
      <script
        // @ts-ignore
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  if (typeof window === 'undefined') return;

  const btn = document.getElementById('btn-report-attendance');
  const dlg = document.getElementById('dlg-report');
  const startInp = document.getElementById('inp-start');
  const endInp = document.getElementById('inp-end');
  const btnCancel = document.getElementById('btn-cancel');
  const btnGenerate = document.getElementById('btn-generate');

  if (!btn || !dlg || !startInp || !endInp || !btnCancel || !btnGenerate) return;

  function todayIso(){
    const d = new Date();
    const m = (d.getMonth()+1).toString().padStart(2,'0');
    const day = d.getDate().toString().padStart(2,'0');
    return d.getFullYear()+'-'+m+'-'+day;
  }

  // abre modal
  btn.addEventListener('click', () => {
    const d = new Date();
    const end = todayIso();
    const startDate = new Date(d.getFullYear(), d.getMonth()-1, d.getDate());
    const m = (startDate.getMonth()+1).toString().padStart(2,'0');
    const day = startDate.getDate().toString().padStart(2,'0');
    const start = startDate.getFullYear()+'-'+m+'-'+day;
    startInp.value = start;
    endInp.value = end;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open','');
  });

  btnCancel.addEventListener('click', () => {
    if ('close' in dlg) dlg.close(); else dlg.removeAttribute('open');
  });

  // util: carrega script externo (jsPDF) uma única vez
  let jsPdfLoaded = false;
  async function ensureJsPdf(){
    if (jsPdfLoaded) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload = () => { jsPdfLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  btnGenerate.addEventListener('click', async () => {
    const classId = btn.getAttribute('data-class-id');
    const className = btn.getAttribute('data-class-name') || 'Turma';
    const start = (startInp.value||'').trim();
    const end = (endInp.value||'').trim();
    if (!classId || !start || !end) { alert('Informe as datas.'); return; }
    if (start > end) { alert('Data inicial não pode ser maior que a final.'); return; }

    // feedback no botão
    const prevTxt = btnGenerate.textContent;
    btnGenerate.textContent = 'Gerando...';
    btnGenerate.disabled = true;

    try {
      await ensureJsPdf();

      // 1) alunos
      const stRes = await fetch('/api/classes/'+classId+'/students', { cache: 'no-store' });
      const stData = await stRes.json().catch(()=>({}));
      const students = (stRes.ok && stData && stData.ok && Array.isArray(stData.students)) ? stData.students : [];

      // 2) chamadas (usa createdAt para o período)
      const chRes = await fetch('/api/classes/'+classId+'/chamadas?order=asc', { cache: 'no-store' });
      const chData = await chRes.json().catch(()=>({}));
      const chamadas = (chRes.ok && chData && chData.ok && Array.isArray(chData.attendances)) ? chData.attendances : [];

      const onlyDate = (iso) => (iso||'').slice(0,10);
      const periodChamadas = chamadas.filter(c => {
        const d = onlyDate(c.createdAt);
        return d && d >= start && d <= end;
      });
      const seqs = periodChamadas.map(c => c.seq);

      // 3) presenças por chamada
      const presenceMapBySeq = {};
      for (const seq of seqs) {
        const prRes = await fetch('/api/classes/'+classId+'/chamadas/'+seq+'/presences', { cache: 'no-store' });
        const prData = await prRes.json().catch(()=>({}));
        const rows = (prRes.ok && prData && prData.ok && Array.isArray(prData.rows)) ? prData.rows : [];
        const map = {};
        for (const r of rows) map[r.studentId] = !!r.present;
        students.forEach(s => { if (!(s.id in map)) map[s.id] = false; }); // ausente por padrão
        presenceMapBySeq[seq] = map;
      }

      // 4) métricas
      const totalAlunos = students.length;
      let somaPresentes = 0;
      const faltasPorAluno = new Map();
      for (const s of students) faltasPorAluno.set(s.id, 0);

      for (const seq of seqs) {
        const pres = presenceMapBySeq[seq] || {};
        let presentesNaAula = 0;
        students.forEach(s => {
          const p = !!pres[s.id];
          if (p) presentesNaAula++;
          else faltasPorAluno.set(s.id, (faltasPorAluno.get(s.id) || 0) + 1);
        });
        somaPresentes += presentesNaAula;
      }

      const totalAulas = seqs.length;
      const mediaPresentesAbs = totalAulas > 0 ? Math.round((somaPresentes / totalAulas) * 100) / 100 : 0;
      const mediaPercentual = (totalAlunos > 0 && totalAulas > 0) ? Math.round((mediaPresentesAbs / totalAlunos) * 10000)/100 : 0;

      const ranking = students
        .map(s => ({ id: s.id, name: s.name, faltas: faltasPorAluno.get(s.id) || 0 }))
        .sort((a,b) => b.faltas - a.faltas);

      // 5) PDF (A4, pt)
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = margin;

      // Header
      doc.setFont('helvetica','bold'); doc.setFontSize(14);
      doc.text('Relatório de Chamadas — ' + className, margin, y); y += 18;
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      doc.text('Período: ' + start + ' a ' + end, margin, y); y += 18;

      // Cards resumo
      doc.setDrawColor(230); doc.setLineWidth(1);
      const cardW = (pageW - margin*2 - 16*2) / 3; // 3 cards, 16px gaps
      const cards = [
        { label: 'Total de alunos', value: String(totalAlunos) },
        { label: 'Média de presentes (abs.)', value: String(mediaPresentesAbs) },
        { label: 'Média de presença (%)', value: String(mediaPercentual) + '%' },
      ];
      const cardH = 56;
      cards.forEach((c, i) => {
        const x = margin + i*(cardW + 16);
        doc.roundedRect(x, y, cardW, cardH, 8, 8);
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(c.label, x + 10, y + 18);
        doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(0);
        doc.text(c.value, x + 10, y + 42);
        doc.setFont('helvetica','normal');
      });
      y += cardH + 24;

      // Título ranking
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Ranking dos mais faltosos', margin, y); y += 14;
      doc.setFont('helvetica','normal'); doc.setFontSize(10);

      // Tabela ranking
      const col1 = margin, col2 = margin + 40, col3 = pageW - margin - 60; // #, Nome, Faltas
      // Cabeçalho
      doc.setFillColor(249,250,251);
      doc.rect(margin, y-10, pageW - margin*2, 22, 'F');
      doc.setFont('helvetica','bold');
      doc.text('#', col1, y);
      doc.text('Aluno', col2, y);
      doc.text('Faltas', col3, y);
      y += 14;
      doc.setFont('helvetica','normal');

      const rowH = 16;
      const maxRowsPerPage = Math.floor((doc.internal.pageSize.getHeight() - margin - y) / rowH) - 2;

      const rows = ranking.map((r,idx) => ({ pos: idx+1, nome: r.name, faltas: r.faltas }));
      if (rows.length === 0) {
        doc.text('Sem dados no período.', margin, y); y += rowH;
      } else {
        for (let i=0;i<rows.length;i++){
          const r = rows[i];
          // quebra de página
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage(); y = margin;
          }
          doc.text(String(r.pos), col1, y);
          // quebra de texto do nome (simples)
          const nomeLines = doc.splitTextToSize(r.nome, col3 - col2 - 10);
          doc.text(nomeLines, col2, y);
          doc.text(String(r.faltas), col3, y);
          y += rowH + (nomeLines.length-1)*10;
        }
      }

      // rodapé simples
      const footer = 'Total de aulas consideradas: ' + String(seqs.length);
      const footerY = doc.internal.pageSize.getHeight() - margin/2;
      doc.setFontSize(9); doc.setTextColor(120);
      doc.text(footer, margin, footerY);

      const fileName = 'Relatorio_Chamadas_' + className.replace(/\\s+/g,'_') + '_' + start + '_a_' + end + '.pdf';
      doc.save(fileName);

      // fecha modal
      if ('close' in dlg) dlg.close(); else dlg.removeAttribute('open');
    } catch (e) {
      console.error(e);
      alert('Falha ao gerar PDF.');
    } finally {
      btnGenerate.textContent = prevTxt;
      btnGenerate.disabled = false;
    }
  });
})();
          `,
        }}
      />
    </main>
  );
}
