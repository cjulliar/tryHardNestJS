"use client";

import { useState } from "react";

// ---------------------------------------------
// Page Chat unique (OpenAI + Tools CopilotKit)
// ---------------------------------------------
// - Un seul chat (custom) connecté à /api/agent (OpenAI)
// - Les tools injectent leurs résultats directement dans le chat
// - Les préférences (ex: langue de traduction) sont envoyées via cookies
//   et influencent toutes les réponses OpenAI suivantes
// ---------------------------------------------

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

export default function ChatPage() {
  const [lang, setLang] = useState("fr");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function callTool(action: string, payload: unknown) {
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    return data;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    
    // Créer un message assistant vide pour le streaming
    const assistantId = `msg-${Date.now()}`;
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "API error");
      }
      
      // Lecture du stream SSE OpenAI
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim() || line === "data: [DONE]") continue;
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content || "";
              if (delta) {
                setMessages((m) => {
                  const last = m[m.length - 1];
                  if (last && last.role === "assistant") {
                    return [...m.slice(0, -1), { ...last, content: last.content + delta }];
                  }
                  return m;
                });
              }
            } catch {}
          }
        }
      }
    } catch (e: unknown) {
      const msg = typeof e === "object" && e && "message" in e ? (e as { message?: string }).message : String(e);
      setMessages((m) => {
        const filtered = m.filter(msg => msg.content !== "");
        return [...filtered, { role: "assistant", content: `Erreur: ${msg}` }];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900">Chat avec Tools CopilotKit</h1>

      {/* Barre d'actions compacte (injecte résultats dans le chat) */}
      <div className="border rounded p-3 bg-white shadow-sm">
        <p className="text-sm text-gray-700 mb-2">Outils (résultats injectés dans le chat) :</p>
        <div className="flex flex-wrap gap-2 items-center">
          <button className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={async () => {
            const history = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");
            const data = await callTool("summarize", { messages: messages.slice(-5), limit: 5 });
            setMessages(m => [...m, { role: "assistant", content: `📝 Résumé des 5 derniers: ${data?.summary || "aucun"}` }]);
          }}>Résumer (5)</button>
          
          <button className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={async () => {
            const lastMsg = messages.filter(m => m.role === "user").pop()?.content || "";
            const data = await callTool("sentiment", { text: lastMsg });
            setMessages(m => [...m, { role: "assistant", content: `😊 Sentiment du dernier message: ${data?.sentiment || "inconnu"}` }]);
          }}>Sentiment</button>
          
          <button className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={async () => {
            const history = messages.map(m => `${m.role}: ${m.content}`).join("\n");
            const data = await callTool("keywords", { text: history });
            const list = Array.isArray(data?.keywords) ? data.keywords.join(", ") : "aucun";
            setMessages(m => [...m, { role: "assistant", content: `🔑 Mots-clés: ${list}` }]);
          }}>Mots-clés</button>
          
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-2 bg-white text-gray-900 text-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="français">Français</option>
              <option value="english">English</option>
              <option value="español">Español</option>
              <option value="deutsch">Deutsch</option>
              <option value="italiano">Italiano</option>
              <option value="português">Português</option>
            </select>
            <button className="px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white text-sm" onClick={async () => {
              await callTool("set.prefs", { translateLang: lang });
              setMessages(m => [...m, { role: "assistant", content: `🌍 Langue définie: ${lang}. Les prochaines réponses seront en ${lang}.` }]);
            }}>Activer traduction</button>
          </div>
          
          <button className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={async () => {
            const q = messages.filter(m => m.role === "user").pop()?.content || "";
            const data = await callTool("rag", { query: q });
            setMessages(m => [...m, { role: "assistant", content: `📚 RAG: ${data?.answer || "aucune réponse"}` }]);
          }}>RAG</button>
          
          <button className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={async () => {
            const last = messages.filter(m => m.role === "assistant").pop()?.content || "";
            const data = await callTool("reformulate", { text: last, style: "plus clair et plus court" });
            setMessages(m => [...m, { role: "assistant", content: `✍️ Reformulé: ${data?.reformulated || "aucun"}` }]);
          }}>Reformuler</button>
        </div>
      </div>

      {/* Chat unique (OpenAI via /api/agent) */}
      <div className="border rounded p-4 space-y-3 bg-white shadow-sm">
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {messages.length === 0 && (
            <p className="text-gray-600">Aucun message. Écrivez ci-dessous pour commencer.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span
                className={
                  m.role === "user"
                    ? "inline-block bg-blue-600 text-white px-3 py-2 rounded"
                    : "inline-block bg-gray-800 text-white px-3 py-2 rounded"
                }
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-gray-900"
            placeholder="Écrivez un message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={sendMessage}
            disabled={loading}
          >
            Envoyer
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 text-gray-900 hover:bg-gray-100"
            onClick={() => { setMessages([]); setInput(""); }}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
