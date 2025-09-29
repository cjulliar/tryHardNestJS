// about/page.tsx — Route "/about"
// - Montre une seconde page pour illustrer le routing par fichiers
export default function AboutPage() {
  return (
    <main className="min-h-screen p-8 sm:p-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">À propos</h1>
        <p className="text-base leading-relaxed opacity-90">
          Ce petit projet a pour but de pratiquer Next.js (app router), Tailwind CSS et les appels d’API.
          Vous y trouverez une page d’accueil simple, un composant réutilisable et un exemple d’appel à une API publique.
        </p>
      </div>
    </main>
  );
}


