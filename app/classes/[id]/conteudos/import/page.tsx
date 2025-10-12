import ImportContentsClient from "./ImportContentsClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Importar conteúdos</h1>
        <a href={`/classes/${id}/conteudos`} className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700">
          Voltar
        </a>
      </div>

      <ImportContentsClient id={id} />
    </main>
  );
}
