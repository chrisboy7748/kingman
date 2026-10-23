"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui";

type State = { error?: string; ok?: string } | null;

/** Formulaire branché sur une action serveur, qui affiche son message de réussite ou d'erreur. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="col-span-full basis-full empty:hidden">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
