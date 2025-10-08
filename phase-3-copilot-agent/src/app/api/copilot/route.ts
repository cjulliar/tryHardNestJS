// Runtime CopilotKit (auto-hébergé)
// Endpoint: /api/copilot
// Objectif: point d'entrée unique pour le chat CopilotKit qui appelle OpenAI
// et peut appliquer des "tools" côté serveur (évolution future).

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };
type CopilotRequestBody = { messages?: ChatMessage[]; input?: string };

export async function POST(req: Request): Promise<Response> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // CopilotKit peut envoyer différents formats; on accepte plusieurs variantes.
    const raw = (await req.json().catch(() => ({} as unknown)));
    const body = raw as Partial<CopilotRequestBody>;

    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : (typeof body.input === "string" && body.input
          ? [{ role: "user", content: String(body.input) }]
          : []);

    const lastUserMessage =
      messages.filter((m) => m.role === "user").pop()?.content || "Bonjour";

    // Préférences côté client (ex: langue de traduction globale)
    const cookie = req.headers.get("cookie") || "";
    const translateLang = (/translateLang=([^;]+)/.exec(cookie)?.[1] || "").trim();
    const systemPrefix = translateLang
      ? `Tu dois répondre en ${decodeURIComponent(translateLang)} et considérer toute la conversation dans cette langue.`
      : "Tu es un assistant utile et concis.";

    // TODO (évolution): appliquer ici des tools serveur (traduction globale, RAG, etc.)

    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrefix },
          ...(messages.length > 0 ? messages : [{ role: "user", content: lastUserMessage }]),
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status, body: text }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const data = await upstream
      .json()
      .catch(() => ({} as { choices?: { message?: { content?: string } }[] }));
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // Réponse standard JSON; CopilotChat peut l'utiliser.
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err && "message" in err
        ? (err as { message?: string }).message
        : undefined;
    return new Response(JSON.stringify({ error: message || "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


