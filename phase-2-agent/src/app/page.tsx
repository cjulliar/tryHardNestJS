import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-20">
      <header className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Phase 2 · Agent + intégration propre</h1>
        <p className="opacity-80 mt-1">Chat UI minimal, proxy API agent, streaming et CopilotKit.</p>
      </header>
      <main className="max-w-5xl mx-auto mt-10">
        <Chat />
      </main>
    </div>
  );
}
