import ContentImport from "@/components/ContentImport";

export default function ConteudosPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Conteúdos — Turma</h1>
      <ContentImport classId={params.id} />
    </main>
  );
}
