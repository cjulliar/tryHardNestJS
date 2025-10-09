// ============================================
// FICHIER: src/app/api/agent/route.ts
// ============================================
//
// QU'EST-CE QU'UNE ROUTE API DANS NEXT.JS ?
// - Un fichier route.ts dans src/app/api/{nom}/ devient un endpoint API
// - src/app/api/agent/route.ts = endpoint POST /api/agent
// - S'exécute côté SERVEUR (Node.js/Edge Runtime)
// - Permet de faire des appels sécurisés (clés API cachées)
//
// ROLE DANS CE PROJET :
// - Reçoit les messages du chat depuis le frontend
// - Appelle l'API OpenAI (gpt-4o-mini) avec streaming
// - Lit les préférences (cookies) pour influencer le prompt
// - Renvoie le flux SSE au client (streaming token par token)
//
// CONCEPTS :
// - Route Handler: fonction export async function POST(req)
// - Streaming SSE: Server-Sent Events (flux de données serveur→client)
// - Cookies: stockent des préférences côté client, lues côté serveur
// - Proxy: ce serveur fait l'intermédiaire entre le frontend et OpenAI
//
// SÉCURITÉ :
// - La clé OpenAI (OPENAI_API_KEY) ne quitte JAMAIS le serveur
// - Le client ne connaît que l'endpoint /api/agent, pas la clé
//
// ============================================

// ============================================
// IMPORTS ET TYPES
// ============================================

// Role: type pour le rôle d'un message (user, assistant, system)
type Role = "user" | "assistant" | "system";

// ChatMessage: structure d'un message
type ChatMessage = { role: Role; content: string };

// AgentRequestBody: structure du body reçu depuis le frontend
type AgentRequestBody = { messages?: ChatMessage[]; prompt?: string };

// ============================================
// HANDLER POST: POINT D'ENTRÉE DE L'API
// ============================================
// export async function POST: Next.js détecte cette fonction et l'utilise
// pour les requêtes POST sur /api/agent
// req: Request = objet de requête Web standard
// Promise<Response>: renvoie une promesse de réponse HTTP

export async function POST(req: Request): Promise<Response> {
  try {
    // ============================================
    // ÉTAPE 1: RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    // ============================================
    // process.env: objet Node.js contenant les variables d'environnement
    // Ces variables sont définies dans .env.local (côté serveur uniquement)
    
    const apiKey = process.env.OPENAI_API_KEY;  // Clé secrète OpenAI
    const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    
    // Vérification: si pas de clé, on renvoie une erreur 500
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // ============================================
    // ÉTAPE 2: PARSE DU BODY DE LA REQUÊTE
    // ============================================
    // req.json(): parse le corps de la requête en objet JavaScript
    // .catch(): si erreur (body invalide), retourne un objet vide
    // as AgentRequestBody: assertion de type TypeScript
    
    const body = (await req.json().catch(() => ({}))) as AgentRequestBody;
    
    // Extraction des messages (avec fallback si absent)
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    
    // Récupère le dernier message utilisateur
    // .filter(): garde seulement les messages user
    // .pop(): prend le dernier
    // || "Hello": valeur par défaut si aucun message
    const lastUserMessage =
      messages.filter((m: ChatMessage) => m.role === "user").pop()?.content || body?.prompt || "Hello";

    // ============================================
    // ÉTAPE 3: LECTURE DES PRÉFÉRENCES (COOKIES)
    // ============================================
    // Les tools posent des cookies (ex: translateLang=english)
    // On les lit ici pour influencer le prompt OpenAI
    
    const cookie = req.headers.get("cookie") || "";  // Header Cookie
    
    // Regex: /translateLang=([^;]+)/ 
    // Cherche "translateLang=VALEUR" dans le cookie
    // [^;]+: capture tout sauf le point-virgule
    // .exec(): exécute la regex et retourne les captures
    // ?.[1]: récupère la première capture (optionnel, évite null)
    const translateLang = (/translateLang=([^;]+)/.exec(cookie)?.[1] || "").trim();
    const injectNote = (/injectNote=([^;]+)/.exec(cookie)?.[1] || "").trim();
    
    // ============================================
    // ÉTAPE 4: CONSTRUCTION DU MESSAGE SYSTÈME
    // ============================================
    // Le message "system" donne des instructions au LLM
    // On l'adapte selon les préférences des tools
    
    const systemParts: string[] = [];  // Tableau des parties du message système
    
    if (translateLang) {
      // decodeURIComponent: décode l'URL encoding (ex: %20 → espace)
      systemParts.push(`Tu dois répondre en ${decodeURIComponent(translateLang)}.`);
    }
    if (injectNote) {
      systemParts.push(decodeURIComponent(injectNote));
    }
    
    // .join(" "): fusionne les parties avec des espaces
    // Si aucune préférence, message par défaut
    const systemPrefix = systemParts.length > 0 
      ? systemParts.join(" ") 
      : "Tu es un assistant utile et concis.";

    // ============================================
    // ÉTAPE 5: APPEL À L'API OPENAI (AVEC STREAMING)
    // ============================================
    // fetch: API Web standard pour faire des requêtes HTTP
    // await: attend que la promesse se résolve
    
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        // Authorization: Bearer {clé}: format standard pour les API
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // JSON.stringify: convertit un objet JavaScript en JSON
      body: JSON.stringify({
        model: "gpt-4o-mini",              // Modèle OpenAI (le moins cher)
        messages: [
          { role: "system", content: systemPrefix },  // Instructions pour l'IA
          { role: "user", content: lastUserMessage }, // Question de l'utilisateur
        ],
        temperature: 0.7,     // Créativité (0 = déterministe, 1 = créatif)
        max_tokens: 300,      // Nombre max de tokens générés
        stream: true,         // ACTIVE LE STREAMING (réponse progressive)
      }),
    });

    // ============================================
    // ÉTAPE 6: VÉRIFICATION DE LA RÉPONSE
    // ============================================
    
    if (!upstream.ok) {
      // upstream.ok: false si status HTTP >= 400 (erreur)
      
      // Récupère le texte d'erreur
      const text = await upstream.text().catch(() => "");
      
      // Renvoie une erreur 502 (Bad Gateway) au client
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status, body: text }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    // ============================================
    // ÉTAPE 7: STREAMING DE LA RÉPONSE
    // ============================================
    // OpenAI renvoie un flux SSE (Server-Sent Events) quand stream: true
    // Format:
    // data: {"choices":[{"delta":{"content":"Hello"}}]}
    // data: {"choices":[{"delta":{"content":" world"}}]}
    // data: [DONE]
    //
    // On proxy ce flux TEL QUEL vers le client
    // Le frontend le lira et affichera les tokens progressivement
    
    if (!upstream.body) {
      // Vérifie que le flux existe
      return new Response(
        JSON.stringify({ error: "No response body" }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    // Renvoie le flux au client
    // upstream.body: ReadableStream du flux SSE
    return new Response(upstream.body, {
      status: 200,
      headers: {
        // text/event-stream: format SSE
        "content-type": "text/event-stream",
        "cache-control": "no-store",      // Pas de cache
        "connection": "keep-alive",       // Garde la connexion ouverte
      },
    });
    
  } catch (err: unknown) {
    // ============================================
    // GESTION D'ERREUR GLOBALE
    // ============================================
    // catch: attrape toutes les erreurs (parsing, réseau, etc.)
    
    // Type guard TypeScript pour extraire le message d'erreur
    // err est de type unknown par défaut (sécurisé)
    const message = typeof err === "object" && err && "message" in err 
      ? (err as { message?: string }).message 
      : undefined;
    
    // Renvoie une erreur 500 (Internal Server Error)
    return new Response(JSON.stringify({ error: message || "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

// ============================================
// RÉSUMÉ DU FLUX
// ============================================
// 1. Frontend envoie POST /api/agent { messages: [...] }
// 2. Serveur lit les cookies (préférences tools)
// 3. Serveur appelle OpenAI avec stream: true
// 4. OpenAI envoie un flux SSE (tokens progressifs)
// 5. Serveur proxy ce flux vers le client
// 6. Frontend lit le flux et affiche token par token
//
// AVANTAGES :
// - Sécurité: clé OpenAI reste côté serveur
// - UX: réponse progressive (pas d'attente de 10s)
// - Flexibilité: on peut injecter des préférences/contexte
// ============================================
