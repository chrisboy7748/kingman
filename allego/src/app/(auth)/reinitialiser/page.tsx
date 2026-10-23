import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { isResetTokenValid } from "@/lib/password-reset";
import { chooseNewPassword } from "../actions";

export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const token = (await searchParams).jeton ?? "";
  const valid = token !== "" && (await isResetTokenValid(token));

  return (
    <div className="panel">
      <h1 className="text-3xl font-extrabold">Nouveau mot de passe</h1>
      {valid ? (
        <ActionForm action={chooseNewPassword} className="mt-6 space-y-5">
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="password" className="label">Nouveau mot de passe</label>
            <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required aria-describedby="password-hint" />
            <p id="password-hint" className="hint mt-1">8 caractères minimum.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirmez le mot de passe</label>
            <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" minLength={8} required />
          </div>
          <SubmitButton pendingLabel="Enregistrement…">Enregistrer et me connecter</SubmitButton>
        </ActionForm>
      ) : (
        <>
          <p className="mt-3 text-grise">Ce lien a expiré ou a déjà servi. Les liens sont valables une heure et une seule fois.</p>
          <Link href="/mot-de-passe-oublie" className="btn btn-primary mt-6">Demander un nouveau lien</Link>
        </>
      )}
    </div>
  );
}
