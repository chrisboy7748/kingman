"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { setupPaypal } from "./actions";

export function PaypalSetupForm() {
  const [state, action] = useActionState(setupPaypal, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <SubmitButton pendingLabel="Création chez PayPal…">Créer les formules et le webhook PayPal</SubmitButton>
      {state?.error && <p role="alert" className="notice notice-warn">{state.error}</p>}
      {state?.note && <p role="status" className="notice">{state.note}</p>}
      {state?.variables && state.variables.length > 0 && (
        <div role="status" className="notice space-y-3">
          <p>
            C&apos;est fait. Ajoutez ces variables dans Vercel (Settings, Environment Variables), puis redéployez le
            site pour qu&apos;elles soient prises en compte. Ne relancez pas cette création : elle ferait des doublons.
          </p>
          <dl className="space-y-2">
            {state.variables.map(([name, value]) => (
              <div key={name}>
                <dt className="text-sm font-semibold">{name}</dt>
                <dd>
                  <input readOnly value={value} className="input font-mono text-sm" onFocus={(e) => e.currentTarget.select()} aria-label={name} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </form>
  );
}
