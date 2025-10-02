// ============================================
// types.ts — Types TypeScript partagés
// ============================================
//
// ROLE DE CE FICHIER :
// - Centralise les types TypeScript utilisés dans l'app (front + back)
// - Évite la duplication de définitions de types
// - Facilite la maintenance : un changement de structure se fait ici
//
// TECHNOLOGIES UTILISÉES :
// - TypeScript (système de types statiques)
//
// POURQUOI DES TYPES ?
// - TypeScript vérifie les types à la compilation → détecte les erreurs tôt
// - Autocomplétion dans l'IDE → meilleure DX (Developer Experience)
// - Documentation implicite du code (on sait ce qu'attend une fonction)
//
// ============================================

// Type pour le rôle d'un message dans le chat
// - "user" : message de l'utilisateur
// - "assistant" : message de l'agent/IA
// - "system" : message système (contexte, instructions)
export type Role = "user" | "assistant" | "system";

// Type pour un message du chat (côté front, avec ID unique)
export type Message = {
  id: string; // ID unique généré par crypto.randomUUID()
  role: Role; // Rôle du message
  content: string; // Contenu textuel du message
};

// Type pour la requête envoyée à l'API /api/agent
export type AgentRequest = {
  messages: Array<{ role: Role; content: string }>; // Tableau de messages (sans id)
};

// Type pour une erreur renvoyée par l'API
export type AgentError = {
  error: string; // Message d'erreur
  status?: number; // Code HTTP optionnel
  body?: string; // Corps de la réponse optionnel (pour debug)
};
