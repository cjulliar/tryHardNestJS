import Link from "next/link";
import Button from "@/src/components/Button";
import JokeCard from "@/src/components/JokeCard";

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-20">
      <header className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          MyFirstNext
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/about" className="text-sm hover:underline">
            À propos
          </Link>
          <a href="#joke" className="text-sm hover:underline">
            Blague
          </a>
        </nav>
      </header>

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

        <JokeCard />
      </main>
    </div>
  );
}
