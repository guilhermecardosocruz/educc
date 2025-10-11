import ContentImport from "@/components/ContentImport";

export default async function ConteudosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Conteúdos — Turma</h1>
      <ContentImport classId={id} />
    </main>
  );
}
