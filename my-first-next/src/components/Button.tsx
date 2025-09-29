"use client";

// Button — composant réutilisable stylé avec Tailwind
// - Props pour variant (primary/secondary/ghost) et size (sm/md/lg)
// - Sert à garder une cohérence visuelle et une API simple pour les boutons

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_TO_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  secondary:
    "border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]",
  ghost: "hover:bg-black/5 dark:hover:bg-white/10",
};

const SIZE_TO_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-base",
  lg: "h-12 px-6 text-base",
};

export function Button({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  variant = "primary",
  size = "md",
}: ButtonProps) {
  // Classes de base + mapping par variant et taille
  const baseClasses = "inline-flex items-center justify-center rounded-full font-medium transition-colors";
  const variantClasses = VARIANT_TO_CLASSES[variant];
  const sizeClasses = SIZE_TO_CLASSES[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;


