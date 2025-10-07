// API route: /api/agent
// Rôle: point d'entrée serveur pour l'agent.
// Ici, on implémente un "proxy" minimal vers l'API OpenAI (Chat Completions)
// afin de séparer le frontend (UI) de l'appel LLM (sécurité: la clé reste côté serveur).
// 
// Où se place CopilotKit Agent ?
// - CopilotKit Agent fournit un runtime serveur (dans Next.js) où définir des "tools"
//   (fonctions outillées), gérer le contexte/mémoire, et orchestrer des appels LLM.
// - Dans un projet CopilotKit complet, on aurait un handler d'agent dédié
//   (ex: src/app/api/copilot/route.ts) exposant un endpoint pour le provider CopilotKit.
// - Ce fichier peut évoluer pour déléguer la génération à ce runtime CopilotKit,
//   ou coexister: /api/agent (proxy direct) + /api/copilot (runtime CopilotKit).

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };
type AgentRequestBody = { messages?: ChatMessage[]; prompt?: string };

export async function POST(req: Request): Promise<Response> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      // En prod: on ne doit jamais exposer la clé au client. Ici on renvoie une erreur générique.
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Le client envoie un tableau de messages { role, content }.
    // Cela imite le format OpenAI et facilite l'interop.
    const body = (await req.json().catch(() => ({}))) as AgentRequestBody;
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const lastUserMessage =
      messages.filter((m: ChatMessage) => m.role === "user").pop()?.content || body?.prompt || "Hello";

    // Appel HTTP côté serveur vers OpenAI. On utilise fetch natif de l'Edge/Node.
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un assistant utile et concis." },
          { role: "user", content: lastUserMessage },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!upstream.ok) {
      // Centralise l'erreur pour diagnostic côté serveur.
      const text = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status, body: text }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    // Réponse OpenAI: { choices: [ { message: { content: "..." } } ] }
    const data = await upstream.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Unexpected response format", data }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    // Pour une UX "streaming" (texte qui s'affiche progressivement), on créerait un ReadableStream
    // et enverrait des chunks. CopilotKit facilite cela côté runtime Agent.
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err: unknown) {
    // Gestion d'erreur globale (ne jamais propager des stacks sensibles au client en prod)
    const message = typeof err === "object" && err && "message" in err ? (err as { message?: string }).message : undefined;
    return new Response(JSON.stringify({ error: message || "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


