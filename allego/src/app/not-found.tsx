import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center px-4">
      <Logo />
      <h1 className="mt-8 text-4xl font-extrabold">Cette page n&apos;existe pas</h1>
      <p className="mt-3 text-grise">Le lien est peut-être incomplet, ou la page a été déplacée.</p>
      <Link href="/" className="btn btn-primary mt-6">Revenir à l&apos;accueil</Link>
    </main>
  );
}
