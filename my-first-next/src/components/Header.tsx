// Header — barre de navigation réutilisable
// - Place la marque à gauche et les liens à droite de manière robuste
import Link from "next/link";

export default function Header() {
  return (
    <header className="max-w-5xl mx-auto flex items-center">
      <Link href="/" className="text-base font-semibold tracking-tight">
        MyFirstNext
      </Link>
      <nav className="ml-auto flex items-center gap-3">
        <Link href="/about" className="text-sm hover:underline">
          À propos
        </Link>
        <Link href="/" className="text-sm hover:underline">
          Accueil
        </Link>
      </nav>
    </header>
  );
}


