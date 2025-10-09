"use client";

// ============================================
// FICHIER: chat/page.tsx (Page du chat)
// ============================================
//
// DIRECTIVE "use client"
// - Indique à Next.js que ce composant s'exécute côté CLIENT (navigateur)
// - Permet d'utiliser les hooks React (useState, useEffect, etc.)
// - Permet d'utiliser les événements (onClick, onChange, etc.)
//
// ROLE DANS CE PROJET :
// - Page du chat avec OpenAI (gpt-4o-mini)
// - Gère l'historique des messages (état local React)
// - Envoie les messages à /api/agent (streaming OpenAI)
// - Expose des tools (boutons) qui influencent la conversation
//
// CONCEPTS REACT :
// - Hooks: fonctions spéciales React (commencent par "use")
// - useState: gère l'état local (données qui changent)
// - État: quand l'état change, React re-rend le composant automatiquement
// - Événements: onClick, onChange, onKeyDown (gestion des interactions utilisateur)
//
// CONCEPTS TYPESCRIPT :
// - type: définit la forme des données
// - Message: { role: "user" | "assistant"; content: string }
//
// STREAMING SSE :
// - Server-Sent Events: flux de données du serveur vers le client
// - OpenAI envoie les tokens un par un (data: {...})
// - On les lit et on met à jour le message progressivement
//
// ============================================

import { useState } from "react";

// ---------------------------------------------
// Page Chat unique (OpenAI + Tools CopilotKit)
// ---------------------------------------------
// - Un seul chat (custom) connecté à /api/agent (OpenAI)
// - Les tools injectent leurs résultats directement dans le chat
// - Les préférences (ex: langue de traduction) sont envoyées via cookies
//   et influencent toutes les réponses OpenAI suivantes
// ---------------------------------------------

// ============================================
// TYPES TYPESCRIPT
// ============================================
// Définissent la structure des données utilisées dans ce composant

// Role: soit "user" (utilisateur), soit "assistant" (IA)
type Role = "user" | "assistant";

// Message: représente un message du chat
// - role: qui a envoyé le message
// - content: le contenu textuel du message
type Message = { role: Role; content: string };

// ============================================
// COMPOSANT CHATPAGE
// ============================================
// export default: exporte le composant (Next.js l'utilise comme page /chat)

export default function ChatPage() {
  // ============================================
  // ÉTAT LOCAL (React Hooks - useState)
  // ============================================
  // useState retourne [valeur, fonction_de_mise_à_jour]
  // Quand on appelle la fonction de mise à jour, React re-rend le composant
  
  // lang: langue choisie pour la traduction globale (valeur par défaut: "fr")
  const [lang, setLang] = useState("fr");
  
  // messages: tableau de tous les messages de la conversation
  // Commence vide ([])
  const [messages, setMessages] = useState<Message[]>([]);
  
  // input: texte saisi par l'utilisateur dans le champ de saisie
  const [input, setInput] = useState("");
  
  // loading: indique si une requête est en cours (désactive le bouton)
  const [loading, setLoading] = useState(false);

  // ============================================
  // FONCTION: APPELER UN TOOL
  // ============================================
  // async: fonction asynchrone (peut faire des await)
  // action: nom du tool (ex: "summarize", "sentiment")
  // payload: données envoyées au tool (ex: { text: "...", lang: "fr" })
  
  async function callTool(action: string, payload: unknown) {
    // fetch: API Web pour faire des requêtes HTTP
    const res = await fetch("/api/tools", {
      method: "POST",                               // Méthode HTTP
      headers: { "content-type": "application/json" }, // Type de contenu
      body: JSON.stringify({ action, payload }),    // Corps de la requête (JSON)
    });
    // .json(): parse la réponse en objet JavaScript
    const data = await res.json();
    return data;
  }

  // ============================================
  // FONCTION: ENVOYER UN MESSAGE AU CHAT
  // ============================================
  // Appelée quand l'utilisateur clique "Envoyer" ou appuie sur Entrée
  
  async function sendMessage() {
    // trim(): enlève les espaces au début et à la fin
    const text = input.trim();
    
    // Si le texte est vide, on ne fait rien
    if (!text) return;
    
    // Vide le champ de saisie
    setInput("");
    
    // Ajoute le message utilisateur à l'historique
    // setMessages((m) => ...) : fonction de mise à jour
    // m: valeur actuelle de messages
    // [...m, newMessage]: crée un nouveau tableau avec l'ancien + le nouveau
    setMessages((m) => [...m, { role: "user", content: text }]);
    
    // Active l'état de chargement (désactive le bouton Envoyer)
    setLoading(true);
    
    // Créer un message assistant vide pour le streaming
    // On va le remplir progressivement au fur et à mesure que les tokens arrivent
    const assistantId = `msg-${Date.now()}`;  // ID unique (timestamp)
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    
    try {
      // ============================================
      // APPEL À L'API /api/agent (STREAMING)
      // ============================================
      
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Envoie tout l'historique + le nouveau message
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });
      
      // Vérification: si erreur HTTP
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "API error");
      }
      
      // ============================================
      // LECTURE DU STREAM SSE (Server-Sent Events)
      // ============================================
      // OpenAI renvoie un flux de données au format:
      // data: {"choices":[{"delta":{"content":"Hello"}}]}
      // data: {"choices":[{"delta":{"content":" world"}}]}
      // data: [DONE]
      
      // getReader(): obtient un lecteur du flux binaire
      const reader = res.body?.getReader();
      
      // TextDecoder: convertit les bytes en texte UTF-8
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No stream");
      
      // Buffer: accumule les données entre deux lignes complètes
      let buffer = "";
      
      // Boucle infinie: lit le flux jusqu'à ce qu'il soit terminé
      while (true) {
        // read(): lit le prochain chunk (morceau) de données
        // value: Uint8Array (bytes)
        // done: true si le flux est terminé
        const { value, done } = await reader.read();
        
        // Si done = true, on sort de la boucle
        if (done) break;
        
        // Décode les bytes en texte et l'ajoute au buffer
        // { stream: true }: gère les caractères multi-bytes entre plusieurs chunks
        buffer += decoder.decode(value, { stream: true });
        
        // Sépare le buffer en lignes (\n)
        const lines = buffer.split("\n");
        
        // Garde la dernière ligne (potentiellement incomplète) dans le buffer
        buffer = lines.pop() || "";
        
        // Pour chaque ligne complète
        for (const line of lines) {
          // Ignore les lignes vides et le marqueur de fin
          if (!line.trim() || line === "data: [DONE]") continue;
          
          // Les lignes SSE commencent par "data: "
          if (line.startsWith("data: ")) {
            try {
              // Parse le JSON après "data: "
              const json = JSON.parse(line.slice(6));
              
              // Extrait le contenu du token (delta)
              // choices[0].delta.content: nouveau morceau de texte
              const delta = json.choices?.[0]?.delta?.content || "";
              
              // Si on a un delta, on l'ajoute au message assistant
              if (delta) {
                setMessages((m) => {
                  // Récupère le dernier message (l'assistant en cours)
                  const last = m[m.length - 1];
                  
                  // Si c'est bien un message assistant, on concatène le delta
                  if (last && last.role === "assistant") {
                    return [
                      ...m.slice(0, -1),                           // Tous les messages sauf le dernier
                      { ...last, content: last.content + delta }  // Dernier message + delta
                    ];
                  }
                  return m;
                });
              }
            } catch {
              // Ignore les erreurs de parsing (ligne malformée)
            }
          }
        }
      }
    } catch (e: unknown) {
      // ============================================
      // GESTION D'ERREUR
      // ============================================
      // Type guard TypeScript pour extraire le message d'erreur
      const msg = typeof e === "object" && e && "message" in e ? (e as { message?: string }).message : String(e);
      
      // Supprime les messages vides et ajoute un message d'erreur
      setMessages((m) => {
        const filtered = m.filter(msg => msg.content !== "");
        return [...filtered, { role: "assistant", content: `Erreur: ${msg}` }];
      });
    } finally {
      // finally: s'exécute toujours (succès ou erreur)
      // Désactive l'état de chargement
      setLoading(false);
    }
  }

  // ============================================
  // RENDU JSX (Interface utilisateur)
  // ============================================
  
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Titre de la page */}
      <h1 className="text-2xl font-semibold text-gray-900">Chat avec Tools CopilotKit</h1>

      {/* ============================================
          BARRE D'OUTILS (TOOLS)
          ============================================
          Boutons qui appellent /api/tools et injectent les résultats dans le chat
      */}
      <div className="border rounded p-3 bg-white shadow-sm">
        <p className="text-sm text-gray-700 mb-2">Outils (résultats injectés dans le chat) :</p>
        
        {/* Conteneur flex: affiche les boutons en ligne, avec retour à la ligne si besoin */}
        <div className="flex flex-wrap gap-2 items-center">
          
          {/* ============================================
              BOUTON: RÉSUMER LES 5 DERNIERS MESSAGES
              ============================================ */}
          <button 
            className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" 
            onClick={async () => {
              // Récupère les 5 derniers messages
              const history = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");
              
              // Appelle le tool "summarize"
              const data = await callTool("summarize", { messages: messages.slice(-5), limit: 5 });
              
              // Injecte le résumé dans le chat comme message assistant
              setMessages(m => [...m, { role: "assistant", content: `📝 Résumé des 5 derniers: ${data?.summary || "aucun"}` }]);
            }}
          >
            Résumer (5)
          </button>
          
          {/* ============================================
              BOUTON: SENTIMENT DU DERNIER MESSAGE
              ============================================ */}
          <button 
            className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" 
            onClick={async () => {
              // Récupère le dernier message utilisateur
              // .filter(): garde seulement les messages user
              // .pop(): prend le dernier
              const lastMsg = messages.filter(m => m.role === "user").pop()?.content || "";
              
              // Appelle le tool "sentiment"
              const data = await callTool("sentiment", { text: lastMsg });
              
              // Injecte le résultat dans le chat
              setMessages(m => [...m, { role: "assistant", content: `😊 Sentiment du dernier message: ${data?.sentiment || "inconnu"}` }]);
            }}
          >
            Sentiment
          </button>
          
          {/* ============================================
              BOUTON: MOTS-CLÉS DE LA CONVERSATION
              ============================================ */}
          <button 
            className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" 
            onClick={async () => {
              // Concatène tout l'historique en une seule chaîne
              const history = messages.map(m => `${m.role}: ${m.content}`).join("\n");
              
              // Appelle le tool "keywords"
              const data = await callTool("keywords", { text: history });
              
              // Formate la liste de mots-clés
              // Array.isArray(): vérifie si c'est un tableau
              // .join(", "): joint les éléments avec des virgules
              const list = Array.isArray(data?.keywords) ? data.keywords.join(", ") : "aucun";
              
              // Injecte dans le chat
              setMessages(m => [...m, { role: "assistant", content: `🔑 Mots-clés: ${list}` }]);
            }}
          >
            Mots-clés
          </button>
          
          {/* ============================================
              TRADUCTION GLOBALE (avec sélecteur de langue)
              ============================================ */}
          <div className="flex items-center gap-2">
            {/* Select: liste déroulante */}
            {/* 
              value={lang}: valeur contrôlée par React
              onChange: appelé quand la valeur change
              e.target.value: nouvelle valeur sélectionnée
            */}
            <select 
              className="border rounded px-2 py-2 bg-white text-gray-900 text-sm" 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="français">Français</option>
              <option value="english">English</option>
              <option value="español">Español</option>
              <option value="deutsch">Deutsch</option>
              <option value="italiano">Italiano</option>
              <option value="português">Português</option>
            </select>
            
            {/* Bouton pour activer la traduction globale */}
            {/* 
              Fonctionnement:
              1. Appelle /api/tools action=set.prefs pour poser un cookie translateLang
              2. /api/agent lit ce cookie au prochain message
              3. Injecte "Tu dois répondre en {langue}" dans le prompt système
              4. OpenAI répond dans la langue demandée
            */}
            <button 
              className="px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white text-sm" 
              onClick={async () => {
                // Pose le cookie translateLang
                await callTool("set.prefs", { translateLang: lang });
                
                // Informe l'utilisateur
                setMessages(m => [...m, { 
                  role: "assistant", 
                  content: `🌍 Langue définie: ${lang}. Les prochaines réponses seront en ${lang}.` 
                }]);
              }}
            >
              Activer traduction
            </button>
          </div>
          
          {/* ============================================
              BOUTON: RAG (Retrieval Augmented Generation)
              ============================================
              Recherche dans un petit corpus et synthétise
          */}
          <button 
            className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" 
            onClick={async () => {
              // Récupère le dernier message user comme requête
              const q = messages.filter(m => m.role === "user").pop()?.content || "";
              
              // Appelle le tool "rag"
              const data = await callTool("rag", { query: q });
              
              // Injecte la réponse dans le chat
              setMessages(m => [...m, { role: "assistant", content: `📚 RAG: ${data?.answer || "aucune réponse"}` }]);
            }}
          >
            RAG
          </button>
          
          {/* ============================================
              BOUTON: REFORMULER LA DERNIÈRE RÉPONSE
              ============================================ */}
          <button 
            className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm" 
            onClick={async () => {
              // Récupère la dernière réponse de l'assistant
              const last = messages.filter(m => m.role === "assistant").pop()?.content || "";
              
              // Appelle le tool "reformulate"
              const data = await callTool("reformulate", { text: last, style: "plus clair et plus court" });
              
              // Injecte la version reformulée dans le chat
              setMessages(m => [...m, { role: "assistant", content: `✍️ Reformulé: ${data?.reformulated || "aucun"}` }]);
            }}
          >
            Reformuler
          </button>
        </div>
      </div>

      {/* ============================================
          ZONE DU CHAT (historique + input)
          ============================================ */}
      <div className="border rounded p-4 space-y-3 bg-white shadow-sm">
        
        {/* ============================================
            HISTORIQUE DES MESSAGES
            ============================================ */}
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {/* Si aucun message, affiche un texte d'accueil */}
          {/* 
            Opérateur && en JSX:
            condition && <element>
            Si condition = true, affiche <element>
            Si condition = false, n'affiche rien
          */}
          {messages.length === 0 && (
            <p className="text-gray-600">Aucun message. Écrivez ci-dessous pour commencer.</p>
          )}
          
          {/* Affiche chaque message */}
          {/* 
            .map(): transforme chaque élément du tableau
            (m, i) => ...: fonction qui prend (message, index) et retourne du JSX
            key={i}: identifiant unique requis par React pour les listes
          */}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              {/* Bulle de message avec style conditionnel */}
              {/* 
                Opérateur ternaire:
                condition ? valeurSiVrai : valeurSiFaux
              */}
              <span
                className={
                  m.role === "user"
                    ? "inline-block bg-blue-600 text-white px-3 py-2 rounded"      // User: bleu
                    : "inline-block bg-gray-800 text-white px-3 py-2 rounded"      // Assistant: gris foncé
                }
              >
                {/* Affiche le contenu du message */}
                {m.content}
              </span>
            </div>
          ))}
        </div>
        
        {/* ============================================
            ZONE DE SAISIE ET BOUTONS
            ============================================ */}
        <div className="flex gap-2 pt-2">
          {/* Champ de saisie */}
          {/* 
            Input contrôlé par React:
            - value={input}: la valeur est contrôlée par l'état React
            - onChange: met à jour l'état à chaque frappe
            - onKeyDown: détecte les touches pressées
          */}
          <input
            className="flex-1 border rounded px-3 py-2 text-gray-900"
            placeholder="Écrivez un message..."
            value={input}
            // e: événement (event object)
            // e.target.value: nouvelle valeur du champ
            onChange={(e) => setInput(e.target.value)}
            // Détecte la touche Entrée (sans Shift) pour envoyer
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}  // Désactive si loading = true
          />
          
          {/* Bouton Envoyer */}
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={sendMessage}
            disabled={loading}  // Désactivé pendant le chargement
          >
            Envoyer
          </button>
          
          {/* Bouton Réinitialiser */}
          {/* 
            Fonction fléchée inline:
            () => { ... }: fonction sans nom, exécutée au clic
          */}
          <button
            className="px-4 py-2 rounded border border-gray-300 text-gray-900 hover:bg-gray-100"
            onClick={() => { 
              setMessages([]);  // Vide l'historique
              setInput("");     // Vide le champ
            }}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
