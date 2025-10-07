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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Métadonnées globales (SEO de base)
  title: "Copilot Agent - Phase 3",
  description: "Projet Next.js d'exploration CopilotKit Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Indicateur: Provider CopilotKit côté client activable si au moins
  // une variable publique est définie (clé publique, runtime URL, licence publique)
  const hasCopilot = Boolean(
    process.env.NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY ||
      process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ||
      process.env.NEXT_PUBLIC_COPILOT_PUBLIC_LICENSE_KEY
  );

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Monte toujours le provider CopilotKit côté client
            (les props internes gèrent l'absence de clé/URL) */}
        <CopilotProvider>{children}</CopilotProvider>
      </body>
    </html>
  );
}
