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

            {/* 🔹 Botão de Relatório (PDF) - abre modal de período e gera PDF sem sair da página */}
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

      {/* 🔸 Modal simples com <dialog> para selecionar o período */}
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

      {/* 🔸 Script client-side embutido (sem criar arquivos) */}
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

  // abrir modal com período padrão = último mês
  btn.addEventListener('click', () => {
    try {
      const d = new Date();
      const end = todayIso();
      const startDate = new Date(d.getFullYear(), d.getMonth()-1, d.getDate());
      const m = (startDate.getMonth()+1).toString().padStart(2,'0');
      const day = startDate.getDate().toString().padStart(2,'0');
      const start = startDate.getFullYear()+'-'+m+'-'+day;
      startInp.value = start;
      endInp.value = end;

      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open','');
    } catch {}
  });

  btnCancel.addEventListener('click', () => {
    if ('close' in dlg) dlg.close(); else dlg.removeAttribute('open');
  });

  btnGenerate.addEventListener('click', async () => {
    const classId = btn.getAttribute('data-class-id');
    const className = btn.getAttribute('data-class-name') || 'Turma';
    const start = (startInp.value||'').trim();
    const end = (endInp.value||'').trim();
    if (!classId || !start || !end) { alert('Informe as datas.'); return; }
    if (start > end) { alert('Data inicial não pode ser maior que a final.'); return; }

    // ✅ abre a janela imediatamente (gesto do usuário) para evitar bloqueio de popup
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) { alert('Bloqueado pelo navegador. Permita pop-ups para gerar o PDF.'); return; }

    // placeholder enquanto buscamos os dados
    const baseCss = \`
      :root { --blue:#0A66FF; --gray:#111827; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji'; margin: 32px; color: var(--gray); }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 20px 0 8px; }
      .muted { color: #6b7280; font-size: 12px; }
      .chip { display:inline-block; padding:2px 8px; border-radius:999px; background:#eef2ff; color: var(--blue); font-weight:600; font-size:12px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; }
      .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
      table { width:100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 8px; border-bottom:1px solid #e5e7eb; text-align:left; }
      th { background:#f9fafb; font-weight:600; }
      @media print { .no-print { display:none; } }
    \`;
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Relatório de Chamadas</title><style>'+baseCss+'</style></head><body><div class="muted">Gerando relatório…</div></body></html>');
    w.document.close();

    try {
      // 1) alunos
      const stRes = await fetch('/api/classes/'+classId+'/students', { cache: 'no-store' });
      const stData = await stRes.json().catch(()=>({}));
      const students = (stRes.ok && stData && stData.ok && Array.isArray(stData.students)) ? stData.students : [];

      // 2) chamadas (usa createdAt como referência de data)
      const chRes = await fetch('/api/classes/'+classId+'/chamadas?order=asc', { cache: 'no-store' });
      const chData = await chRes.json().catch(()=>({}));
      const chamadas = (chRes.ok && chData && chData.ok && Array.isArray(chData.attendances)) ? chData.attendances : [];

      // filtra por período [start, end]
      const onlyDate = (iso) => (iso||'').slice(0,10);
      const periodChamadas = chamadas.filter(c => {
        const d = onlyDate(c.createdAt);
        return d && d >= start && d <= end;
      });

      // 3) presenças de cada chamada do período
      const seqs = periodChamadas.map(c => c.seq);
      const presenceMapBySeq = {};
      for (const seq of seqs) {
        const prRes = await fetch('/api/classes/'+classId+'/chamadas/'+seq+'/presences', { cache: 'no-store' });
        const prData = await prRes.json().catch(()=>({}));
        const rows = (prRes.ok && prData && prData.ok && Array.isArray(prData.rows)) ? prData.rows : [];
        const map = {};
        for (const r of rows) { map[r.studentId] = !!r.present; }
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
        .sort((a,b) => b.faltas - a.faltas)
        .slice(0, 50);

      const headerHtml = \`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <h1>Relatório de Chamadas — \${className}</h1>
            <div class="muted">Período: \${start} a \${end}</div>
          </div>
          <div class="chip">PDF</div>
        </div>
      \`;

      const resumoHtml = \`
        <div class="grid">
          <div class="card"><div class="muted">Total de alunos</div><div style="font-size:22px;font-weight:700">\${totalAlunos}</div></div>
          <div class="card"><div class="muted">Média de presentes (abs.)</div><div style="font-size:22px;font-weight:700">\${mediaPresentesAbs}</div></div>
          <div class="card"><div class="muted">Média de presença (%)</div><div style="font-size:22px;font-weight:700">\${mediaPercentual}%</div></div>
        </div>
      \`;

      const rankingRows = ranking.map((r,idx) => \`
        <tr>
          <td style="width:40px">\${idx+1}</td>
          <td>\${r.name}</td>
          <td style="width:120px">\${r.faltas}</td>
        </tr>\`).join('');

      const rankingHtml = \`
        <h2>Ranking dos mais faltosos</h2>
        <table>
          <thead><tr><th>#</th><th>Aluno</th><th>Faltas</th></tr></thead>
          <tbody>\${rankingRows || '<tr><td colspan="3">Sem dados no período.</td></tr>'}</tbody>
        </table>
      \`;

      // atualiza conteúdo da janela já aberta
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Relatório de Chamadas</title><style>'+baseCss+'</style></head><body>'+headerHtml+resumoHtml+rankingHtml+'<div class="no-print" style="margin-top:16px;"><button onclick="window.print()">Imprimir / Salvar PDF</button></div></body></html>');
      w.document.close();

      // fecha modal e dispara print
      if ('close' in dlg) dlg.close(); else dlg.removeAttribute('open');
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 200);
    } catch (e) {
      console.error(e);
      try {
        w.document.body.innerHTML = '<div style="color:#b91c1c;">Falha ao gerar relatório.</div>';
      } catch {}
      alert('Falha ao gerar relatório.');
    }
  });
})();
          `,
        }}
      />
    </main>
  );
}
