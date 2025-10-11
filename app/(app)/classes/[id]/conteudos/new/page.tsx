export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Adicionar conteúdo</h1>
        <a
          href={`/classes/${id}/conteudos`}
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
        >
          Voltar
        </a>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); alert("Salvar conteúdo: implementar POST /api/classes/[id]/conteudos"); }}
          className="grid gap-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Aula (nº)</label>
              <input name="lesson" type="number" min={1} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Ex.: 1" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Título <span className="text-red-600">*</span></label>
              <input name="title" required className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Ex.: Robótica de introdução" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Conteúdo da Aula <span className="text-red-600">*</span></label>
            <textarea name="content" required rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="O que será abordado…"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Objetivos</label>
            <textarea name="goals" rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="- Identificar…&#10;- Compreender…"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Desenvolvimento das Atividades</label>
            <textarea name="activities" rows={4} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Passo a passo/roteiro da aula…"></textarea>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recursos Didáticos</label>
              <input name="resources" className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Kit robótico, notebook, projetor…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">BNCC</label>
              <input name="bncc" className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="EF02TE01; EF05CI06" />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90">
              Salvar conteúdo
            </button>
            <a href={`/classes/${id}/conteudos`} className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700">
              Cancelar
            </a>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6">
        <p className="text-sm text-gray-600">
          Também é possível <a className="text-[#0A66FF] underline" href={`/classes/${id}/conteudos/import`}>importar conteúdos por planilha</a>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.csv" target="_blank" rel="noreferrer">Baixar modelo CSV</a>
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.xlsx" target="_blank" rel="noreferrer">Baixar modelo XLSX</a>
        </div>
      </div>
    </main>
  );
}
