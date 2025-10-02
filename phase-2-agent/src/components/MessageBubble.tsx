// ============================================
// MessageBubble.tsx — Bulle de message du chat
// ============================================
//
// ROLE DE CE FICHIER :
// - Affiche un message (user ou assistant) sous forme de bulle
// - Alignement différent selon le rôle :
//   * user : aligné à droite, fond noir
//   * assistant : aligné à gauche, bordure grise
//
// TECHNOLOGIES UTILISÉES :
// - React (composant fonctionnel)
// - TypeScript (typage de la prop message)
// - Tailwind CSS (classes utilitaires pour le style conditionnel)
//
// ============================================

import { Message } from "@/lib/types"; // Type TypeScript pour un message

// ============================================
// COMPOSANT MESSAGEBUBBLE
// ============================================
// Props : { message } — un objet Message avec id, role, content

export default function MessageBubble({ message }: { message: Message }) {
  // Détermine si le message est de l'utilisateur (pour l'alignement et le style)
  const isUser = message.role === "user";
  
  return (
    // Conteneur : toute la largeur, alignement conditionnel (droite si user, gauche sinon)
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bulle de message avec style conditionnel */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-foreground text-background" // User : fond noir, texte blanc
            : "border border-black/[.08] dark:border-white/[.145]" // Assistant : bordure grise
        }`}
      >
        {/* Contenu du message (texte) */}
        {message.content}
      </div>
    </div>
  );
}
