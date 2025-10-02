// ============================================
// route.ts — API Route Handler (Next.js App Router)
// ============================================
//
// ROLE DE CE FICHIER :
// - Point d'entrée API côté serveur : `/api/agent`
// - Reçoit des messages de chat depuis le client
// - Proxifie vers l'API Hugging Face (ou autre LLM) avec la clé secrète
// - Renvoie la réponse en streaming (flux texte progressif) au client
// - Mode mock : si USE_AGENT_MOCK=true, renvoie un flux simulé (pour tester sans vraie API)
//
// TECHNOLOGIES UTILISÉES :
// - Next.js App Router (convention /api/<route>/route.ts)
// - Fetch API (appel HTTP vers l'API LLM)
// - ReadableStream (streaming de la réponse)
// - Variables d'environnement (process.env)
//
// SÉCURITÉ :
// - La clé API (AGENT_API_KEY) n'est jamais exposée au client
// - Le serveur Next.js agit comme proxy : client → Next → HF → Next → client
// - Le client ne connaît que l'endpoint /api/agent, pas l'URL/clé HF
//
// ============================================

import { NextRequest } from "next/server"; // Type pour la requête Next.js

// ============================================
// TYPES TYPESCRIPT
// ============================================

// Type pour le rôle d'un message
type Role = "user" | "assistant" | "system";

// Type pour un message de chat
export type ChatMessage = { role: Role; content: string };

// ============================================
// FONCTION UTILITAIRE : LIRE UNE VARIABLE D'ENVIRONNEMENT
// ============================================

/**
 * Lit une variable d'environnement et retourne undefined si vide
 * @param name - Nom de la variable d'environnement
 * @returns La valeur ou undefined
 */
function getEnv(name: string): string | undefined {
  const v = process.env[name]; // Lit la variable depuis process.env
  return v && v.length > 0 ? v : undefined; // Retourne undefined si vide
}



// ============================================
// HANDLER POST : POINT D'ENTRÉE DE L'API
// ============================================

/**
 * Gère les requêtes POST sur /api/agent
 * @param req - Requête Next.js contenant le body { messages }
 */
export async function POST(req: NextRequest) {
  // Point d'entrée principal: accepte un body { messages: {role, content}[] }
  try {
    // Parse le body JSON de la requête
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    
    // Validation : messages doit être un tableau
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid body: messages[] is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Vérification obligatoire des variables d'environnement
    const apiUrl = getEnv("AGENT_API_URL");
    const apiKey = getEnv("AGENT_API_KEY");
    
    if (!apiUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing AGENT_API_URL or AGENT_API_KEY" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    // ============================================
    // PROXY VERS L'API LLM (HUGGING FACE)
    // ============================================
    
    // Log pour debug (visible dans les logs serveur Next.js)
    console.log("[API Agent] Calling:", apiUrl);
    console.log("[API Agent] Has API Key:", !!apiKey);
    
    const controller = new AbortController(); // Permet d'annuler la requête si besoin

    // OpenAI Chat Completions API - format correct
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    
    // Appel à l'API OpenAI avec le format Chat Completions
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un assistant utile et concis." },
          { role: "user", content: lastUserMessage }
        ],
        temperature: 0.7,
        max_tokens: 250
      }),
      signal: controller.signal,
    });

    // Vérification : si l'API upstream renvoie une erreur ou pas de body
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => ""); // Récupère le texte d'erreur
      console.error("[API Agent] Upstream error:", upstream.status, text);
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status, body: text }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
    
    // OpenAI renvoie du JSON, pas un stream texte
    // On doit transformer la réponse en stream pour le client
    const data = await upstream.json();
    console.log("[API Agent] Response:", data);
    
    // Format de réponse OpenAI: { choices: [{ message: { content: "..." } }] }
    let generatedText = "";
    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
      generatedText = data.choices[0].message.content;
    } else if (data.error) {
      console.error("[API Agent] OpenAI error:", data.error);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: data.error }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    } else {
      console.error("[API Agent] Unexpected response format:", data);
      return new Response(
        JSON.stringify({ error: "Unexpected response format", data }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
    
    // Crée un stream artificiel à partir du texte généré
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(generatedText));
        controller.close();
      },
    });

    // Renvoie le stream au client
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (err: unknown) {
    // Erreur générique (body invalide, JSON mal formé, etc.)
    return new Response(
      JSON.stringify({ error: "Bad Request" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
}

// ============================================
// HANDLER GET : BLOQUE LES REQUÊTES GET
// ============================================

/**
 * Renvoie 405 Method Not Allowed si quelqu'un essaie un GET sur /api/agent
 */
export async function GET() {
  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    { status: 405, headers: { "content-type": "application/json" } }
  );
}
