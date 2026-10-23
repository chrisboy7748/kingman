import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/plans";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <div className="panel">
      <h1 className="text-3xl font-extrabold">Créer mon compte</h1>
      <p className="mt-2 text-grise">
        {TRIAL_DAYS} jours gratuits, sans paiement. Vous choisirez ensuite de vous abonner ou non.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-feuille underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
