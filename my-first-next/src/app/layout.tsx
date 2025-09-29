// layout.tsx — Layout racine pour l’App Router
// - S’applique à toutes les routes sous `src/app`
// - Définit la police (via next/font), la langue et injecte les styles globaux
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Métadonnées par défaut du site (SEO de base)
export const metadata: Metadata = {
  title: "MyFirstNext — Next.js + Tailwind",
  description: "Projet d’apprentissage Next.js, Tailwind et API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Le layout enveloppe toutes les pages. On applique les variables de fontes pour Tailwind.
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
