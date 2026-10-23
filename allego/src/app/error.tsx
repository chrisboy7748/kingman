"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center px-4">
      <h1 className="text-4xl font-extrabold">Cette page n&apos;a pas pu s&apos;afficher</h1>
      <p className="mt-3 text-grise">
        Vos données ne sont pas perdues. Réessayez dans un instant ; si le problème continue, écrivez-nous en
        indiquant le code {error.digest ?? "affiché"}.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn btn-primary">Réessayer</button>
        <Link href="/" className="btn btn-secondary">Accueil</Link>
      </div>
    </main>
  );
}
