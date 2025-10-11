"use client";
import { useState } from "react";

export default function ContentImport({ classId }: { classId: string }) {
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const form = new FormData();
    form.append("file", f);
    setUploading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/conteudos/import`, { method: "POST", body: form });
      const data = await res.json();
      alert(data.message || (res.ok ? "Import concluído" : "Falha ao importar"));
    } catch {
      alert("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-600">Escolher arquivo (CSV/XLSX)</label>
      <input
        type="file"
        accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel"
        onChange={onFile}
        className="block w-full rounded border border-gray-300 p-2"
      />
    </div>
  );
}
