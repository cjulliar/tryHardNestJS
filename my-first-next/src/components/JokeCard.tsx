"use client";

import React from "react";
import Button from "@/src/components/Button";

type JokeResponse = {
  value: string;
};

export default function JokeCard() {
  const [joke, setJoke] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  async function fetchJoke() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("https://api.chucknorris.io/jokes/random", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as JokeResponse;
      setJoke(data.value);
    } catch (err) {
      setError("Impossible de récupérer une blague. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <section id="joke" className="w-full max-w-2xl rounded-2xl border border-black/[.08] dark:border-white/[.145] p-6">
      <h2 className="text-lg font-semibold mb-3">Blague aléatoire</h2>
      {loading ? (
        <p className="text-sm opacity-80">Chargement…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <p className="text-base leading-relaxed">{joke}</p>
      )}
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={fetchJoke}>
          Nouvelle blague
        </Button>
      </div>
    </section>
  );
}


