// page.tsx — Page d’accueil
// - Démontre le routage (fichier `page.tsx` dans `src/app` = route "/")
// - Utilise un composant réutilisable Button et un composant client JokeCard
import Link from "next/link";
import Button from "@/components/Button";
import JokeCard from "@/components/JokeCard";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-20">
      {/* Header réutilisable */}
      <Header />

      {/* Contenu principal : titre, texte d’intro et boutons d’action */}
      <main className="max-w-5xl mx-auto mt-16 flex flex-col gap-10">
        <section className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Next.js + Tailwind, simple et pro
          </h1>
          <p className="mt-3 text-base opacity-90">
            Une base minimale pour apprendre le routage, les composants réutilisables et les appels d’API.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="/about">
              <Button>En savoir plus</Button>
            </Link>
            <a href="#joke">
              <Button variant="secondary">Voir une blague</Button>
            </a>
          </div>
        </section>

        {/* Composant client qui illustre un fetch et de l’état local */}
        <JokeCard />
      </main>
    </div>
  );
}
