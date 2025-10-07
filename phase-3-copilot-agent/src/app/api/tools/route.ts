// Runtime de tools "serveur" minimal (simule un runtime d'agent)
// POST /api/tools avec body: { action: string, payload?: any }
// Actions: summarize, fetch, context.set, context.get

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };

const memory = new Map<string, string>();

export async function POST(req: Request): Promise<Response> {
  try {
    const { action, payload } = (await req.json().catch(() => ({}))) as {
      action?: string;
      payload?: unknown;
    };

    if (!action) {
      return json({ error: "Missing action" }, 400);
    }

    if (action === "summarize") {
      const { messages = [], limit = 5 } = (payload as { messages?: ChatMessage[]; limit?: number }) || {};
      const last = (Array.isArray(messages) ? messages : []).slice(-Math.max(1, Number(limit) || 5));
      // Résumé naïf (démo): concatène et coupe. En prod: appeler l'API LLM ici.
      const merged = last.map((m) => `${m.role}: ${m.content}`).join("\n");
      const summary = merged.length > 600 ? merged.substring(0, 600) + "…" : merged;
      return json({ summary });
    }

    if (action === "fetch") {
      const { url } = (payload as { url?: string }) || {};
      if (!url) return json({ error: "Missing url" }, 400);
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      // Résumé naïf: premières 800 lettres
      const summary = text.replace(/\s+/g, " ").slice(0, 800) + (text.length > 800 ? "…" : "");
      return json({ ok: true, status: res.status, summary });
    }

    if (action === "context.set") {
      const { key, value } = (payload as { key?: string; value?: string }) || {};
      if (!key) return json({ error: "Missing key" }, 400);
      memory.set(key, String(value ?? ""));
      return json({ ok: true });
    }

    if (action === "context.get") {
      const { key } = (payload as { key?: string }) || {};
      if (!key) return json({ error: "Missing key" }, 400);
      return json({ value: memory.get(key) ?? null });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    const message = typeof err === "object" && err && "message" in err ? (err as { message?: string }).message : undefined;
    return json({ error: message || "Internal error" }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}


