export const metadata = { title: "Offline • EDUCC" };

export default function Offline() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Você está offline</h1>
        <p className="text-gray-600 mt-2">Alguns recursos podem não estar disponíveis sem conexão.</p>
      </div>
    </main>
  );
}
