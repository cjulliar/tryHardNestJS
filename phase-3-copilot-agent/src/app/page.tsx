// ============================================
// FICHIER: page.tsx (Page d'accueil)
// ============================================
//
// QU'EST-CE QU'UNE PAGE DANS NEXT.JS ?
// - Un fichier page.tsx dans src/app/ devient une route accessible
// - src/app/page.tsx = route "/"  (page d'accueil)
// - src/app/chat/page.tsx = route "/chat"
//
// ROLE DANS CE PROJET :
// - Page d'accueil qui présente le projet
// - Affiche des liens vers la documentation et vers /chat
// - Composant serveur par défaut (pas de hooks React)
//
// CONCEPTS REACT :
// - Composant fonctionnel: fonction qui retourne du JSX
// - JSX: syntaxe qui mélange HTML et JavaScript
// - Pas de state ici (composant statique)
//
// ============================================

import Image from "next/image";
import Link from "next/link";

// ---------------------------------------------
// FICHIER: page.tsx (Page d'accueil)
// ---------------------------------------------
// - Présente le projet et offre un lien vers le chat
// - Composant serveur par défaut (peut rendre des enfants clients)
// - Sert de porte d'entrée pour découvrir l'agent
// ---------------------------------------------

// ============================================
// COMPOSANT HOME (Page d'accueil)
// ============================================
// export default: exporte le composant comme export par défaut
// Next.js l'utilise automatiquement comme page

export default function Home() {
  // ============================================
  // RENDU JSX
  // ============================================
  // return: renvoie le JSX qui sera affiché
  
  return (
    // Conteneur principal avec Tailwind CSS
    // className: classes CSS (Tailwind)
    // - font-sans: police sans-serif
    // - grid: affichage en grille CSS
    // - grid-rows-[20px_1fr_20px]: 3 lignes (header 20px, main flex, footer 20px)
    // - min-h-screen: hauteur minimale = hauteur de l'écran
    // - p-8: padding de 8 unités Tailwind
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* ============================================
          MAIN: contenu principal
          ============================================ */}
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Logo Next.js (composant Image de Next.js) */}
        {/* 
          next/image optimise les images:
          - Lazy loading automatique
          - Formats modernes (WebP)
          - Responsive
        */}
        <Image
          className="dark:invert"  // Inverse les couleurs en mode sombre
          src="/next.svg"          // Chemin relatif depuis /public
          alt="Next.js logo"       // Texte alternatif (accessibilité)
          width={180}              // Largeur en pixels
          height={38}              // Hauteur en pixels
          priority                 // Charge l'image immédiatement (pas de lazy loading)
        />
        
        {/* Liste ordonnée avec instructions */}
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Commencez par modifier{" "}
            {/* Code inline */}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Enregistrez et voyez vos changements instantanément.
          </li>
        </ol>

        {/* ============================================
            BOUTONS D'ACTION
            ============================================ */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          {/* Lien externe vers Vercel (déploiement) */}
          {/* 
            Balise <a>: lien HTML classique (navigation externe)
            target="_blank": ouvre dans un nouvel onglet
            rel="noopener noreferrer": sécurité (évite l'accès à window.opener)
          */}
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Déployer maintenant
          </a>
          
          {/* Link de Next.js (navigation interne) */}
          {/* 
            Composant Link de Next.js:
            - Navigation côté client (SPA)
            - Pas de rechargement de page
            - Préchargement automatique au hover
          */}
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/chat"
          >
            Ouvrir le chat
          </Link>
          
          {/* Lien vers la documentation */}
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lire la documentation
          </a>
        </div>
      </main>
      
      {/* ============================================
          FOOTER: pied de page
          ============================================ */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* Liens vers ressources Next.js */}
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden   // Masque l'image pour les lecteurs d'écran (décorative)
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Apprendre
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Exemples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Aller sur nextjs.org →
        </a>
      </footer>
    </div>
  );
}
