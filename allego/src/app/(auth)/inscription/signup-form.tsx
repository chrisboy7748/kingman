"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../actions";
import { FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signup, null);
  return (
    <form action={action} className="mt-6 space-y-5">
      <FormMessage state={state} />
      <div>
        <label htmlFor="name" className="label">Prénom</label>
        <input id="name" name="name" className="input" autoComplete="given-name" required />
      </div>
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="hint mt-1">8 caractères minimum.</p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="healthConsent" className="mt-1 h-4 w-4 accent-feuille" required />
        <span>
          J&apos;accepte qu&apos;Allégo enregistre mes mesures (poids, taille, alimentation), qui sont des
          données de santé, uniquement pour calculer et suivre mon programme. Je peux retirer cet accord
          en supprimant mon compte.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-feuille" required />
        <span>
          J&apos;ai lu les{" "}
          <Link href="/cgv" className="underline" target="_blank">conditions générales</Link> et la{" "}
          <Link href="/confidentialite" className="underline" target="_blank">politique de confidentialité</Link>.
        </span>
      </label>
      <SubmitButton pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </form>
  );
}
