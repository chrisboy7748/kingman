"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-5">
      <FormMessage state={state} />
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
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}
