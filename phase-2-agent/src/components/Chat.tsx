// ============================================
// Chat.tsx — Composant client de chat interactif
// ============================================
//
// QU'EST-CE QU'UN FICHIER .TSX ?
// - TSX = TypeScript + JSX (syntaxe qui mélange JavaScript et HTML-like)
// - Permet d'écrire des composants React avec du typage TypeScript
// - La partie "JSX" permet d'écrire du HTML directement dans le code JS/TS
// - Le compilateur transforme le JSX en appels React classiques
//
// ROLE DE CE FICHIER :
// - Composant principal du chat côté client (navigateur)
// - Gère l'état local : historique des messages, input utilisateur, état de chargement
// - Envoie les messages à l'API serveur `/api/agent` via fetch
// - Reçoit la réponse en streaming (flux texte progressif) et l'affiche en temps réel
// - Intègre une action CopilotKit pour demander un résumé des 5 derniers messages
//
// TECHNOLOGIES UTILISÉES :
// - React (hooks: useState pour l'état local)
// - TypeScript (typage des variables et props)
// - Fetch API (appel HTTP au serveur)
// - ReadableStream (lecture du flux texte progressif)
// - CopilotKit (framework pour actions d'agent côté front)
//
// ============================================

"use client"; // Directive Next.js: ce composant s'exécute côté client (navigateur), pas côté serveur

import React from "react"; // Bibliothèque React pour créer des composants UI
import { Message } from "@/lib/types"; // Type TypeScript pour un message (id, role, content)
import Button from "@/components/Button"; // Composant bouton réutilisable
import MessageBubble from "@/components/MessageBubble"; // Composant bulle de message (affiche un message user/assistant)
import { readTextStream } from "@/lib/streaming"; // Fonction utilitaire pour lire un flux texte chunk par chunk
import { useCopilotAction } from "@copilotkit/react-core"; // Hook CopilotKit pour définir une action outillée

export default function Chat() {
  // ============================================
  // ÉTAT LOCAL DU COMPOSANT (React hooks)
  // ============================================
  
  // messages: tableau de tous les messages de la conversation (user + assistant)
  // setMessages: fonction pour mettre à jour ce tableau
  const [messages, setMessages] = React.useState<Message[]>([]);
  
  // input: texte saisi par l'utilisateur dans le champ de texte
  // setInput: fonction pour mettre à jour ce texte
  const [input, setInput] = React.useState<string>("");
  
  // loading: indique si une requête est en cours (pour désactiver le bouton Envoyer)
  // setLoading: fonction pour basculer cet état
  const [loading, setLoading] = React.useState<boolean>(false);

  // ============================================
  // ACTION COPILOTKIT : RÉSUMÉ DES 5 DERNIERS MESSAGES
  // ============================================
  // Cette action définit une fonction réutilisable que CopilotKit peut appeler
  // Elle peut être déclenchée par l'UI (bouton) ou par CopilotKit lui-même
  useCopilotAction({
    name: "summarizeLastMessages", // Nom unique de l'action
    description: "Demande un résumé des 5 derniers messages", // Description pour CopilotKit
    // parameters vide car l'action ne prend pas de paramètres d'entrée
    parameters: [],
    // handler: fonction asynchrone exécutée quand l'action est appelée
    handler: async () => {
      // Récupère les 5 derniers messages et ne garde que role et content (pas l'id)
      const lastFive = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      setLoading(true); // Active l'état de chargement
      try {
        // Appel à notre API serveur /api/agent avec les 5 derniers messages + une demande de résumé
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [...lastFive, { role: "user", content: "Fais un court résumé." }] }),
        });
        // Vérification : si la réponse n'est pas OK ou pas de body, on lance une erreur
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        
        // Crée un ID unique pour le message de l'assistant (réponse)
        const assistantId = crypto.randomUUID();
        // Ajoute immédiatement un message assistant vide dans l'historique
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);
        
        // Lit le flux texte progressivement et concatène les chunks au message assistant
        await readTextStream(res.body, chunk => {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
        });
      } catch {
        // Gestion d'erreur: affiche un message d'erreur dans le chat
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Erreur durant le résumé." }]);
      } finally {
        setLoading(false); // Désactive l'état de chargement quoi qu'il arrive
      }
    },
  });

  // ============================================
  // FONCTION : ENVOYER UN MESSAGE
  // ============================================
  // Appelée quand l'utilisateur clique sur "Envoyer" ou appuie sur Entrée
  async function sendMessage() {
    // Si l'input est vide (après trim), on ne fait rien
    if (!input.trim()) return;
    
    // Crée un nouveau message utilisateur avec un ID unique
    const newMsg: Message = {
      id: crypto.randomUUID(), // Génère un ID unique (UUID v4)
      role: "user", // Rôle : utilisateur
      content: input.trim(), // Contenu du message (sans espaces inutiles)
    };
    
    // Ajoute le message à l'historique
    setMessages(prev => [...prev, newMsg]);
    // Vide le champ de texte
    setInput("");

    setLoading(true); // Active l'état de chargement
    try {
      // Appel à l'API serveur /api/agent avec tous les messages (historique + nouveau)
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // On envoie tous les messages mais seulement role et content (pas l'id)
          messages: [...messages, newMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      
      // Vérification : si erreur HTTP ou pas de body, on lance une exception
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Crée un ID unique pour le message de réponse de l'assistant
      const assistantId = crypto.randomUUID();
      // Ajoute immédiatement un message assistant vide dans l'historique
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      // Lecture du flux texte et mise à jour en continu
      // À chaque chunk reçu, on l'ajoute au contenu du message assistant
      await readTextStream(res.body, chunk => {
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      });
    } catch {
      // En cas d'erreur (réseau, serveur, etc.), on affiche un message d'erreur générique
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Une erreur est survenue." },
      ]);
    } finally {
      setLoading(false); // Désactive l'état de chargement dans tous les cas
    }
  }

  // ============================================
  // FONCTION : RÉINITIALISER LE CHAT
  // ============================================
  function reset() {
    setMessages([]); // Vide l'historique des messages
    setInput(""); // Vide le champ de texte
  }

  // ============================================
  // RENDU JSX (HTML-like dans le code)
  // ============================================
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Zone d'affichage des messages (historique) */}
      <div className="border border-black/[.08] dark:border-white/[.145] rounded-2xl p-4 h-[60vh] overflow-auto space-y-2">
        {messages.length === 0 ? (
          // Si aucun message, affiche un texte d'accueil
          <p className="text-sm opacity-80">Démarre la conversation…</p>
        ) : (
          // Sinon, affiche chaque message avec le composant MessageBubble
          // .map crée un élément pour chaque message du tableau
          messages.map(m => <MessageBubble key={m.id} message={m} />)
        )}
      </div>
      
      {/* Zone de saisie et boutons */}
      <div className="mt-3 flex gap-2">
        {/* Champ de texte pour saisir un message */}
        <input
          className="flex-1 rounded-xl border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-transparent"
          placeholder="Écris un message…"
          value={input} // Valeur contrôlée par l'état React
          onChange={e => setInput(e.target.value)} // Met à jour l'état à chaque frappe
          onKeyDown={e => {
            // Si l'utilisateur appuie sur Entrée (sans Shift), on envoie le message
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Empêche le retour à la ligne
              sendMessage(); // Envoie le message
            }
          }}
        />
        
        {/* Bouton Envoyer (désactivé si loading = true) */}
        <Button onClick={sendMessage} disabled={loading}>
          Envoyer
        </Button>
        
        {/* Bouton Reset (réinitialise le chat) */}
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
        
        {/* Bouton "Demander un résumé" (envoie les 5 derniers messages à l'agent) */}
        <Button 
          variant="ghost" 
          onClick={() => {
            // Si moins de 1 message, on ne fait rien
            if (messages.length < 1) return;
            // Récupère les 5 derniers messages
            const lastFive = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
            setLoading(true);
            // Appel fetch direct (alternative à l'action CopilotKit)
            fetch("/api/agent", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ messages: [...lastFive, { role: "user", content: "Fais un court résumé." }] }),
            })
              .then(async res => {
                if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
                const assistantId = crypto.randomUUID();
                setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);
                await readTextStream(res.body, chunk => {
                  setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
                });
              })
              .catch(() => {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Erreur durant le résumé." }]);
              })
              .finally(() => setLoading(false));
          }}
        >
          Demander un résumé
        </Button>
      </div>
    </div>
  );
}
