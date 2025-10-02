// ============================================
// Button.tsx — Composant bouton réutilisable
// ============================================
//
// ROLE DE CE FICHIER :
// - Composant UI simple : un bouton stylé avec Tailwind CSS
// - Réutilisable dans toute l'app avec différents variants (primary, secondary, ghost)
// - Gère les tailles (sm, md, lg) et l'état disabled
//
// TECHNOLOGIES UTILISÉES :
// - React (composant fonctionnel)
// - TypeScript (typage des props)
// - Tailwind CSS (classes utilitaires pour le style)
//
// POURQUOI UN COMPOSANT RÉUTILISABLE ?
// - Évite de répéter le code HTML+CSS des boutons partout
// - Centralise le style : si on veut changer le look des boutons, on modifie ici
// - API simple et cohérente (props variant, size, disabled, onClick...)
//
// ============================================

"use client"; // Directive Next.js: ce composant s'exécute côté client

import React from "react";

// ============================================
// TYPES TYPESCRIPT
// ============================================

// Type pour les variants de bouton (apparence)
type Variant = "primary" | "secondary" | "ghost";

// Type pour les tailles de bouton
type Size = "sm" | "md" | "lg";

// Type pour les props (propriétés) du composant Button
export type ButtonProps = {
  children: React.ReactNode; // Contenu du bouton (texte, icône, etc.)
  onClick?: () => void; // Fonction appelée au clic (optionnelle)
  type?: "button" | "submit" | "reset"; // Type HTML du bouton
  className?: string; // Classes CSS supplémentaires (optionnelles)
  disabled?: boolean; // Si true, le bouton est désactivé
  variant?: Variant; // Variant de style (par défaut: primary)
  size?: Size; // Taille du bouton (par défaut: md)
};

// ============================================
// MAPPING VARIANT → CLASSES CSS
// ============================================
// Record = objet TypeScript où les clés sont des Variant et les valeurs des strings

const VARIANT: Record<Variant, string> = {
  // primary: fond noir, texte blanc, hover gris foncé
  primary: "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  // secondary: bordure fine, fond transparent, hover gris clair
  secondary:
    "border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]",
  // ghost: pas de bordure, fond transparent, hover léger
  ghost: "hover:bg-black/5 dark:hover:bg-white/10",
};

// ============================================
// MAPPING TAILLE → CLASSES CSS
// ============================================

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm", // Petit bouton
  md: "h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-base", // Moyen (par défaut)
  lg: "h-12 px-6 text-base", // Grand bouton
};

// ============================================
// COMPOSANT BUTTON
// ============================================

export default function Button({
  children,
  onClick,
  type = "button", // Par défaut: type="button" (ne soumet pas de formulaire)
  className = "", // Pas de classes supplémentaires par défaut
  disabled = false, // Pas désactivé par défaut
  variant = "primary", // Variant par défaut: primary
  size = "md", // Taille par défaut: md
}: ButtonProps) {
  // Classes de base communes à tous les boutons
  const base = "inline-flex items-center justify-center rounded-full font-medium transition-colors";
  
  // Rendu JSX : élément <button> HTML avec classes Tailwind dynamiques
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      // className concatène toutes les classes : base + variant + taille + custom
      className={`${base} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  );
}
