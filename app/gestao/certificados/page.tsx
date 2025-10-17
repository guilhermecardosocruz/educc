export const dynamic = "force-dynamic";

export default function GestaoCertificadosPage() {
  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Requisitos para Certificados</h1>
        <a href="/gestao" className="btn-primary">Voltar</a>
      </header>

      <section className="card p-6">
        <p className="text-gray-700">aqui terá requisitos para gerar certificados</p>
      </section>
    </main>
  );
}
