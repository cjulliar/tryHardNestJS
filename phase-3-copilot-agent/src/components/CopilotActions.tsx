"use client";

// ---------------------------------------------
// CopilotActions (frontend)
// ---------------------------------------------
// Rôle:
// - Enregistre des actions (tools) côté client via useCopilotAction.
// - Ces actions deviennent découvrables/exécutables par l'agent CopilotKit
//   et/ou par l'UI (selon la configuration du provider et du runtime).
// Tools exposés ici:
// - resumerDerniersMessages: résume les 5 derniers messages via /api/tools
// - resumerUrl: récupère une URL côté serveur et renvoie un extrait résumé
// - contexteSet / contexteGet: petite mémoire clé→valeur (démonstration)
// Note: ici on appelle notre endpoint /api/tools qui simule un runtime serveur
//       Si un runtime CopilotKit serveur est ajouté, on peut migrer ces tools côté serveur.

import { useCopilotAction } from "@copilotkit/react-core";

type Props = {
  getLastMessages: (n: number) => string;
  onAssistant: (text: string) => void;
};

export function CopilotActions({ getLastMessages, onAssistant }: Props) {
  useCopilotAction({
    name: "resumerDerniersMessages",
    description: "Résume les N derniers messages de la conversation.",
    parameters: [],
    handler: async () => {
      const messagesText = getLastMessages(5);
      // Appel du runtime tools côté serveur
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "summarize", payload: { messages: parseMessages(messagesText), limit: 5 } }),
      });
      const data = await res.json();
      onAssistant(data?.summary ? `(Résumé) ${data.summary}` : "(Résumé) Aucune donnée");
    },
  });

  useCopilotAction({
    name: "resumerUrl",
    description: "Récupère une URL et en donne un bref résumé.",
    parameters: [],
    handler: async () => {
      const url = prompt("URL à résumer ?");
      if (!url) return;
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "fetch", payload: { url } }),
      });
      const data = await res.json();
      onAssistant(data?.summary ? `(Fetch) ${data.summary}` : "(Fetch) Aucune donnée");
    },
  });

  useCopilotAction({
    name: "contexteSet",
    description: "Stocke une valeur en mémoire (clé → valeur).",
    parameters: [],
    handler: async () => {
      const key = prompt("Clé ?") || "demo";
      const value = prompt("Valeur ?") || new Date().toISOString();
      await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "context.set", payload: { key, value } }),
      });
      onAssistant(`(Mémoire) Clé '${key}' enregistrée.`);
    },
  });

  useCopilotAction({
    name: "contexteGet",
    description: "Récupère une valeur de la mémoire.",
    parameters: [],
    handler: async () => {
      const key = prompt("Clé ?") || "demo";
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "context.get", payload: { key } }),
      });
      const data = await res.json();
      onAssistant(`(Mémoire) ${key} = ${data?.value ?? "<null>"}`);
    },
  });

  return null;
}

function parseMessages(text: string): { role: "user" | "assistant"; content: string }[] {
  // Parse très simple d'une chaîne "role: content" par ligne
  return text
    .split(/\n+/)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const role = line.slice(0, idx).trim();
      const content = line.slice(idx + 1).trim();
      if (role !== "user" && role !== "assistant") return null;
      return { role, content } as const;
    })
    .filter(Boolean) as { role: "user" | "assistant"; content: string }[];
}


