"use client";

export default function ImportBox({ classId }: { classId: string }) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/classes/${classId}/students/import`, { method: "POST", body: fd });
      const data = await res.json();
      alert(res.ok && data?.ok ? `Importados: ${data.createdCount}` : (data?.error ?? 'Erro ao importar'));
    } catch {
      alert('Falha de rede');
    } finally {
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="mt-6 border rounded-2xl p-4">
      <h2 className="font-medium">Adicionar alunos por planilha</h2>
      <p className="text-sm text-gray-600 mt-1">
        CSV ou XLSX com colunas: <b>name</b> (obrigatório), <b>cpf</b> e <b>contact</b> (opcionais).
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border-2 border-dashed p-8 text-center text-sm text-gray-600">
          <div className="text-3xl">+</div>
          <p className="mt-1">Clique para selecionar ou arraste seu arquivo aqui</p>
          <p className="text-xs mt-1">Formatos aceitos: CSV, XLSX</p>
          <input type="file" accept=".csv,.xlsx" className="mt-3" onChange={handleFile} />
        </div>

        <div className="flex flex-wrap gap-2">
          <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.csv" target="_blank">Baixar modelo CSV</a>
          <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.xlsx" target="_blank">Baixar modelo XLSX</a>
        </div>
      </div>
    </div>
  );
}
