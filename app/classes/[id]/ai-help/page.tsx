export default async function AiHelpPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Ajuda com IA</h1>
      <p className="text-gray-700">
        Aqui terá ajuda de IA para a turma <b>{id}</b>.
      </p>
    </main>
  );
}
