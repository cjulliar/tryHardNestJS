// ============================================
// FICHIER: src/app/api/tools/route.ts
// ============================================
//
// ROLE :
// - Endpoint API pour les "tools" (outils) du chat
// - Chaque tool effectue une action spécifique (résumé, sentiment, traduction, etc.)
// - Appelé par les boutons de l'interface chat
//
// ACTIONS DISPONIBLES :
// - summarize: résume les N derniers messages
// - fetch: récupère une page web et la résume
// - sentiment: analyse le sentiment d'un texte (via OpenAI)
// - keywords: extrait les mots-clés (via OpenAI)
// - translate: traduit un texte dans une langue donnée (via OpenAI)
// - rag: recherche dans un corpus et synthétise (démo)
// - reformulate: reformule un texte (via OpenAI)
// - set.prefs: pose des cookies de préférences (langue, notes)
//
// CONCEPTS :
// - Route Handler Next.js (côté serveur)
// - Appels OpenAI (non-streaming pour les tools)
// - Cookies HTTP (stockage de préférences)
// - Map (mémoire clé→valeur in-memory)
//
// ============================================

// Type pour les rôles de messages
type Role = "user" | "assistant" | "system";

// Type pour un message de chat
type ChatMessage = { role: Role; content: string };

// ============================================
// MÉMOIRE IN-MEMORY (DÉMO)
// ============================================
// Map: structure de données JavaScript clé→valeur
// Utilisée ici pour stocker des contextes temporaires
// En production: utiliser une DB (Redis, PostgreSQL, etc.)

const memory = new Map<string, string>();

// ============================================
// HANDLER POST: POINT D'ENTRÉE
// ============================================

export async function POST(req: Request): Promise<Response> {
  try {
    // ============================================
    // PARSE DU BODY
    // ============================================
    // Attend: { action: "nom_action", payload: {...} }
    
    const { action, payload } = (await req.json().catch(() => ({}))) as {
      action?: string;
      payload?: unknown;  // Type inconnu (sera casté selon l'action)
    };

    // Vérification: action est obligatoire
    if (!action) {
      return json({ error: "Missing action" }, 400);
    }

    // ============================================
    // ACTION: SUMMARIZE (Résumer les messages)
    // ============================================
    if (action === "summarize") {
      // Cast du payload vers le type attendu
      const { messages = [], limit = 5 } = (payload as { messages?: ChatMessage[]; limit?: number }) || {};
      
      // Récupère les N derniers messages
      // Array.isArray(): vérifie si c'est un tableau
      // .slice(-N): prend les N derniers éléments
      // Math.max(1, N): assure au moins 1
      const last = (Array.isArray(messages) ? messages : []).slice(-Math.max(1, Number(limit) || 5));
      
      // Résumé naïf (démo): concatène les messages
      // .map(): transforme chaque message en string
      // .join("\n"): fusionne avec des retours à la ligne
      const merged = last.map((m) => `${m.role}: ${m.content}`).join("\n");
      
      // Coupe à 600 caractères si trop long
      const summary = merged.length > 600 ? merged.substring(0, 600) + "…" : merged;
      
      // Renvoie le résumé en JSON
      return json({ summary });
    }

    // ============================================
    // ACTION: FETCH (Récupérer et résumer une URL)
    // ============================================
    if (action === "fetch") {
      const { url } = (payload as { url?: string }) || {};
      
      // Validation: URL obligatoire
      if (!url) return json({ error: "Missing url" }, 400);
      
      // Fetch de la page web
      const res = await fetch(url, { method: "GET" });
      
      // Récupère le contenu HTML/texte
      const text = await res.text();
      
      // Résumé naïf: enlève les espaces multiples et coupe
      // .replace(/\s+/g, " "): remplace tous les espaces multiples par un seul
      // .slice(0, 800): prend les 800 premiers caractères
      const summary = text.replace(/\s+/g, " ").slice(0, 800) + (text.length > 800 ? "…" : "");
      
      return json({ ok: true, status: res.status, summary });
    }

    // ============================================
    // ACTION: SENTIMENT (Analyse de sentiment)
    // ============================================
    if (action === "sentiment") {
      const { text = "" } = (payload as { text?: string }) || {};
      
      // Construit un prompt pour OpenAI
      const prompt = `Analyse le sentiment du texte suivant (positive, neutre ou negative). Réponds par un seul mot: \n\n${text}`;
      
      // Appelle OpenAI (fonction helper définie plus bas)
      const content = await callOpenAI(prompt);
      
      // Renvoie le sentiment en minuscules
      return json({ sentiment: (content || "").toLowerCase() });
    }

    // ============================================
    // ACTION: KEYWORDS (Extraction de mots-clés)
    // ============================================
    if (action === "keywords") {
      const { text = "" } = (payload as { text?: string }) || {};
      
      // Prompt pour extraire les mots-clés
      const prompt = `Extrait 5 à 10 mots-clés du texte suivant, séparés par des virgules:\n\n${text}`;
      
      // Appelle OpenAI
      const content = await callOpenAI(prompt);
      
      // Parse la réponse: sépare par virgules ou retours à la ligne
      // .split(/[,\n]/): regex pour séparer sur , ou \n
      // .map(s => s.trim()): enlève les espaces de chaque élément
      // .filter(Boolean): enlève les éléments vides
      const list = (content || "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      
      return json({ keywords: list });
    }

    // ============================================
    // ACTION: RAG (Retrieval Augmented Generation)
    // ============================================
    // Recherche dans un corpus et synthétise une réponse
    
    if (action === "rag") {
      const { query = "" } = (payload as { query?: string }) || {};
      
      // Petit corpus fictif (démo)
      // En prod: chercher dans une vraie base de données / vector store
      const corpus = [
        "CopilotKit est un framework pour intégrer des agents IA dans des apps React/Next.js.",
        "Le runtime d'agent permet de définir des tools côté serveur et de gérer le streaming.",
        "Les clés sensibles doivent rester côté serveur pour des raisons de sécurité.",
      ];
      
      // Recherche naïve: garde les paragraphes contenant la requête
      // .toLowerCase(): met en minuscules pour comparaison insensible à la casse
      // .includes(): vérifie si la chaîne contient la sous-chaîne
      const hits = corpus.filter((p) => p.toLowerCase().includes(String(query).toLowerCase()));
      
      // Construit un contexte à partir des résultats
      const context = hits.join("\n");
      
      // Prompt pour OpenAI: réponds en utilisant le contexte
      const prompt = `À partir du contexte ci-dessous, réponds de façon concise à la requête.\nContexte:\n${context}\n\nQuestion: ${query}`;
      
      // Appelle OpenAI
      const content = await callOpenAI(prompt);
      
      return json({ answer: content, sources: hits });
    }

    // ============================================
    // ACTION: TRANSLATE (Traduction)
    // ============================================
    if (action === "translate") {
      const { text = "", lang = "fr" } = (payload as { text?: string; lang?: string }) || {};
      
      // Prompt de traduction
      const prompt = `Traduire en ${lang} le texte suivant, sans commentaires:\n\n${text}`;
      
      // Appelle OpenAI
      const content = await callOpenAI(prompt);
      
      return json({ translated: content });
    }

    // ============================================
    // ACTION: REFORMULATE (Reformulation)
    // ============================================
    if (action === "reformulate") {
      const { text = "", style = "plus clair et plus court" } = (payload as { text?: string; style?: string }) || {};
      
      // Prompt de reformulation
      const prompt = `Réécris le texte suivant en étant ${style}, sans changer le sens:\n\n${text}`;
      
      // Appelle OpenAI
      const content = await callOpenAI(prompt);
      
      return json({ reformulated: content });
    }

    // ============================================
    // ACTION: CONTEXT.SET (Sauvegarder en mémoire)
    // ============================================
    if (action === "context.set") {
      const { key, value } = (payload as { key?: string; value?: string }) || {};
      
      if (!key) return json({ error: "Missing key" }, 400);
      
      // Stocke en mémoire (Map)
      // memory.set(clé, valeur): ajoute ou met à jour
      memory.set(key, String(value ?? ""));
      
      return json({ ok: true });
    }

    // ============================================
    // ACTION: CONTEXT.GET (Récupérer de la mémoire)
    // ============================================
    if (action === "context.get") {
      const { key } = (payload as { key?: string }) || {};
      
      if (!key) return json({ error: "Missing key" }, 400);
      
      // Récupère de la mémoire
      // memory.get(clé): retourne la valeur ou undefined
      // ?? null: si undefined, renvoie null
      return json({ value: memory.get(key) ?? null });
    }

    // ============================================
    // ACTION: SET.PREFS (Poser des préférences)
    // ============================================
    // Pose des cookies HTTP que /api/agent lira au prochain message
    // Permet d'influencer le comportement du chat
    
    if (action === "set.prefs") {
      const { translateLang, injectNote } = (payload as { translateLang?: string; injectNote?: string }) || {};
      
      // Headers: objet pour les en-têtes HTTP de la réponse
      const headers = new Headers({ "content-type": "application/json" });
      
      // Si une langue de traduction est fournie
      if (translateLang) {
        // headers.append(): ajoute un header
        // set-cookie: pose un cookie HTTP
        // encodeURIComponent: encode pour éviter les problèmes avec caractères spéciaux
        // Path=/: cookie valide pour toutes les routes
        // HttpOnly: pas accessible via JavaScript client (sécurité)
        // SameSite=Lax: protection CSRF
        headers.append(
          "set-cookie",
          `translateLang=${encodeURIComponent(translateLang)}; Path=/; HttpOnly; SameSite=Lax`
        );
      }
      
      // Si une note à injecter est fournie
      if (typeof injectNote === "string") {
        headers.append(
          "set-cookie",
          `injectNote=${encodeURIComponent(injectNote)}; Path=/; HttpOnly; SameSite=Lax`
        );
      }
      
      // Renvoie une confirmation avec les cookies
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // ============================================
    // ACTION INCONNUE
    // ============================================
    // Si aucune action ne correspond, renvoie une erreur
    return json({ error: `Unknown action: ${action}` }, 400);
    
  } catch (err) {
    // Gestion d'erreur globale
    const message = typeof err === "object" && err && "message" in err ? (err as { message?: string }).message : undefined;
    return json({ error: message || "Internal error" }, 500);
  }
}

// ============================================
// FONCTION HELPER: JSON RESPONSE
// ============================================
// Simplifie la création de réponses JSON
// data: données à renvoyer
// status: code HTTP (200 par défaut)

function json(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),  // Convertit en JSON
    {
      status,
      headers: { 
        "content-type": "application/json",  // Type de contenu
        "cache-control": "no-store"          // Pas de cache
      },
    }
  );
}

// ============================================
// FONCTION HELPER: APPELER OPENAI (SANS STREAMING)
// ============================================
// Utilisée par les tools pour faire des appels ponctuels à OpenAI
// prompt: instruction/question pour l'IA
// Retourne: la réponse textuelle

async function callOpenAI(prompt: string): Promise<string> {
  // Récupère la clé API depuis les variables d'environnement
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  
  // Si pas de clé, renvoie une chaîne vide
  if (!apiKey) return "";
  
  // Appel à l'API OpenAI (format Chat Completions)
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${apiKey}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",              // Modèle le moins cher
      messages: [
        { role: "system", content: "Tu es un assistant utile et concis." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,  // Peu créatif (réponses plus déterministes)
      max_tokens: 300,   // Limite de tokens
    }),
  });
  
  // Si erreur, renvoie une chaîne vide
  if (!res.ok) return "";
  
  // Parse la réponse JSON
  const data = await res.json().catch(() => ({}));
  
  // Extrait le contenu de la réponse
  // choices[0].message.content: texte généré par l'IA
  // ?? "": si undefined, renvoie ""
  return data?.choices?.[0]?.message?.content || "";
}

// ============================================
// RÉSUMÉ DU FLUX
// ============================================
// 1. Frontend clique sur un bouton tool (ex: "Sentiment")
// 2. Frontend envoie POST /api/tools { action: "sentiment", payload: { text: "..." } }
// 3. Serveur exécute l'action correspondante
// 4. Pour sentiment/keywords/translate/reformulate: appelle OpenAI via callOpenAI()
// 5. Pour fetch: récupère la page web et la résume
// 6. Pour set.prefs: pose un cookie que /api/agent lira
// 7. Renvoie le résultat au frontend
// 8. Frontend injecte le résultat dans le chat
//
// AVANTAGES :
// - Modularité: chaque tool est indépendant
// - Sécurité: clés API côté serveur
// - Flexibilité: facile d'ajouter de nouveaux tools
// ============================================

