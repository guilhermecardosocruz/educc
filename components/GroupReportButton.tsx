"use client";
import { useMemo, useState } from "react";
import DateRangePicker from "./DateRangePicker";

export default function GroupReportButton({ groupId }: { groupId: string }) {
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const monthStart = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  }, []);

  const [range, setRange] = useState<{ from: string; to: string }>({ from: monthStart, to: today });
  const [loading, setLoading] = useState(false);
  const disabled = loading || !range.from || !range.to;

  async function handleGenerate() {
    if (!range.from || !range.to) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to }).toString();
      const res = await fetch(`/api/class-groups/${groupId}/report?${qs}`, {
        method: "GET",
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "Falha ao gerar PDF");
        throw new Error(msg || "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-grupo-${groupId}-${range.from}_a_${range.to}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      alert(e?.message || "Erro ao gerar relatório");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <DateRangePicker from={range.from} to={range.to} onChange={setRange} disabled={loading} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled}
          className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Gerando PDF..." : "Gerar relatório em PDF"}
        </button>
        <span className="text-xs text-gray-600">Média de presença (abs. e %) e Top 5 faltantes por turma.</span>
      </div>
    </div>
  );
}
