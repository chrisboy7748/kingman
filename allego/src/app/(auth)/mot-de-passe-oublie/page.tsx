import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { forgotPassword } from "../actions";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="panel">
      <h1 className="text-3xl font-extrabold">Mot de passe oublié</h1>
      <p className="mt-2 text-grise">Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <ActionForm action={forgotPassword} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <SubmitButton pendingLabel="Envoi…">Recevoir le lien</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm">
        <Link href="/connexion" className="font-semibold text-feuille underline">Retour à la connexion</Link>
      </p>
    </div>
  );
}
