"use client";

import { useActionState } from "react";
import { deleteAccount } from "./actions";
import { FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <FormMessage state={state} />
      <div className="max-w-xs">
        <label htmlFor="delete-password" className="label">Confirmez avec votre mot de passe</label>
        <input id="delete-password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn btn-danger" pendingLabel="Suppression…">
        Supprimer définitivement mon compte
      </SubmitButton>
    </form>
  );
}
