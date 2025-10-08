// Runtime de tools "serveur" minimal (simule un runtime d'agent)
// POST /api/tools avec body: { action: string, payload?: any }
// Actions: summarize, fetch, context.set, context.get, sentiment, keywords, rag, translate, reformulate

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

    if (action === "sentiment") {
      const { text = "" } = (payload as { text?: string }) || {};
      const prompt = `Analyse le sentiment du texte suivant (positive, neutre ou negative). Réponds par un seul mot: \n\n${text}`;
      const content = await callOpenAI(prompt);
      return json({ sentiment: (content || "").toLowerCase() });
    }

    if (action === "keywords") {
      const { text = "" } = (payload as { text?: string }) || {};
      const prompt = `Extrait 5 à 10 mots-clés du texte suivant, séparés par des virgules:\n\n${text}`;
      const content = await callOpenAI(prompt);
      const list = (content || "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      return json({ keywords: list });
    }

    if (action === "rag") {
      const { query = "" } = (payload as { query?: string }) || {};
      // Petit corpus fictif (démo)
      const corpus = [
        "CopilotKit est un framework pour intégrer des agents IA dans des apps React/Next.js.",
        "Le runtime d'agent permet de définir des tools côté serveur et de gérer le streaming.",
        "Les clés sensibles doivent rester côté serveur pour des raisons de sécurité.",
      ];
      const hits = corpus.filter((p) => p.toLowerCase().includes(String(query).toLowerCase()));
      const context = hits.join("\n");
      const prompt = `À partir du contexte ci-dessous, réponds de façon concise à la requête.\nContexte:\n${context}\n\nQuestion: ${query}`;
      const content = await callOpenAI(prompt);
      return json({ answer: content, sources: hits });
    }

    if (action === "translate") {
      const { text = "", lang = "fr" } = (payload as { text?: string; lang?: string }) || {};
      const prompt = `Traduire en ${lang} le texte suivant, sans commentaires:\n\n${text}`;
      const content = await callOpenAI(prompt);
      return json({ translated: content });
    }

    if (action === "reformulate") {
      const { text = "", style = "plus clair et plus court" } = (payload as { text?: string; style?: string }) || {};
      const prompt = `Réécris le texte suivant en étant ${style}, sans changer le sens:\n\n${text}`;
      const content = await callOpenAI(prompt);
      return json({ reformulated: content });
    }

    // Préférences (ex: langue cible pour la traduction globale du chat)
    if (action === "set.prefs") {
      const { translateLang, injectNote } = (payload as { translateLang?: string; injectNote?: string }) || {};
      const headers = new Headers({ "content-type": "application/json" });
      if (translateLang) {
        headers.append(
          "set-cookie",
          `translateLang=${encodeURIComponent(translateLang)}; Path=/; HttpOnly; SameSite=Lax`
        );
      }
      if (typeof injectNote === "string") {
        headers.append(
          "set-cookie",
          `injectNote=${encodeURIComponent(injectNote)}; Path=/; HttpOnly; SameSite=Lax`
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
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

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  if (!apiKey) return "";
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un assistant utile et concis." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });
  if (!res.ok) return "";
  const data = await res.json().catch(() => ({}));
  return data?.choices?.[0]?.message?.content || "";
}


