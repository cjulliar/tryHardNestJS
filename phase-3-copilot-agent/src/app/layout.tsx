// ============================================
// FICHIER: layout.tsx (Root Layout)
// ============================================
//
// QU'EST-CE QU'UN ROOT LAYOUT ?
// - Dans Next.js App Router, layout.tsx définit la structure HTML globale
// - Il enveloppe TOUTES les pages de l'application
// - C'est un Server Component par défaut (s'exécute côté serveur)
// - Parfait pour: métadonnées, polices, providers globaux
//
// ROLE DANS CE PROJET :
// - Définit la balise <html> avec lang="fr" (français)
// - Charge les polices Google (Geist)
// - Injecte les styles globaux (globals.css)
// - Monte le CopilotProvider (composant client) pour activer CopilotKit
//
// CONCEPTS REACT/NEXT.JS :
// - Composant fonctionnel: fonction qui retourne du JSX
// - Props: { children } = contenu des pages enfants
// - Server Component: s'exécute côté serveur, pas de hooks React (useState, useEffect)
//
// ============================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CopilotProvider } from "@/components/CopilotProvider";

// ---------------------------------------------
// FICHIER: layout.tsx (Root Layout)
// ---------------------------------------------
// - Point d'entrée UI global de l'app (App Router Next.js)
// - Définit l'HTML de base (<html lang="fr">), polices, styles globaux
// - Composant serveur par défaut, qui rend un wrapper client: <CopilotProvider>
//   pour instancier CopilotKit côté client et fournir son contexte à toute l'UI
// ---------------------------------------------

// ============================================
// CONFIGURATION DES POLICES (next/font)
// ============================================
// next/font optimise les polices Google:
// - Télécharge les polices au build
// - Les sert en local (pas de requête externe au runtime)
// - Génère des variables CSS (--font-geist-sans, --font-geist-mono)

const geistSans = Geist({
  variable: "--font-geist-sans", // Nom de la variable CSS
  subsets: ["latin"],            // Sous-ensemble de caractères (optimisation)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================
// MÉTADONNÉES (SEO)
// ============================================
// Définit le titre et la description de l'app (affichés dans l'onglet navigateur)
// Ces métadonnées sont fusionnées avec celles des pages enfants

export const metadata: Metadata = {
  title: "Copilot Agent - Phase 3",
  description: "Projet Next.js d'exploration CopilotKit Agent",
};

// ============================================
// COMPOSANT ROOT LAYOUT
// ============================================
// Props:
// - children: React.ReactNode = contenu des pages enfants (page.tsx, chat/page.tsx, etc.)
//
// Readonly<...>: type TypeScript qui empêche la modification des props

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ============================================
  // DÉTECTION DE LA CONFIGURATION COPILOTKIT
  // ============================================
  // On vérifie si au moins une variable publique CopilotKit est définie
  // Ces variables commencent par NEXT_PUBLIC_ (accessibles côté client)
  
  const hasCopilot = Boolean(
    process.env.NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY ||      // Clé publique CopilotKit Cloud
      process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ||       // URL d'un runtime CopilotKit
      process.env.NEXT_PUBLIC_COPILOT_PUBLIC_LICENSE_KEY   // Licence publique
  );

  // ============================================
  // RENDU JSX
  // ============================================
  // JSX = syntaxe qui mélange JavaScript et HTML
  // Permet d'écrire du HTML directement dans le code
  
  return (
    // Balise <html> : racine du document HTML
    <html lang="fr">
      {/* Commentaire JSX : syntaxe {slash-star ... star-slash} */}
      
      {/* Balise <body> : corps du document */}
      <body
        // className : équivalent de "class" en HTML (mais "class" est un mot réservé JS)
        // Template string ${...} pour interpoler les variables
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          CopilotProvider : composant client qui instancie CopilotKit
          - Fournit le contexte CopilotKit à tous les enfants
          - Permet d'utiliser les hooks CopilotKit (useCopilotAction, etc.)
          - Activé uniquement si hasCopilot = true
        */}
        <CopilotProvider>{children}</CopilotProvider>
      </body>
    </html>
  );
}
