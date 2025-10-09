"use client";

export default function NewChamadaClient({ classId }: { classId: string }) {
  async function handleCreate() {
    const input = document.getElementById('title') as HTMLInputElement | null;
    const title = input?.value?.trim() || undefined;

    const res = await fetch(`/api/classes/${classId}/chamadas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title })
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      alert(data?.error ?? "Erro ao criar chamada");
      return;
    }
    window.location.href = `/classes/${classId}/chamadas/${data.attendance.seq}`;
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button onClick={handleCreate} className="btn-primary">Criar chamada</button>
      {/* Link de cancelar fica na página (para preservar prefetch do Next), não aqui */}
    </div>
  );
}
