import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getAccess } from "@/lib/account";
import { formatDateTime } from "@/lib/dates";
import { paypalConfigured } from "@/lib/paypal";
import { PLANS, type PlanKey } from "@/lib/plans";
import { SubmitButton } from "@/components/submit-button";
import { cancelSubscription, startCheckout } from "./actions";

export const metadata: Metadata = { title: "Abonnement" };

const ERRORS: Record<string, string> = {
  config: "Le paiement n'est pas encore activé sur Allégo. Réessayez plus tard.",
  paypal: "PayPal n'a pas pu créer l'abonnement. Aucun paiement n'a été effectué. Réessayez dans quelques minutes.",
  retour: "Votre abonnement n'a pas pu être confirmé. S'il apparaît dans votre compte PayPal, il sera activé automatiquement d'ici quelques minutes.",
  resiliation: "La résiliation n'a pas abouti. Réessayez, ou résiliez directement depuis votre compte PayPal.",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string; annule?: string; resilie?: string; erreur?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const access = await getAccess(user.id, user.trialEndsAt);
  const pending = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
    orderBy: desc(schema.subscriptions.updatedAt),
  });
  const awaitingActivation = params.merci && access.kind !== "abonne" && pending?.status === "APPROVED";

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold">Abonnement</h1>

      {params.merci && access.kind === "abonne" && (
        <p role="status" className="notice text-lg">Merci ! Votre abonnement est actif.</p>
      )}
      {awaitingActivation && (
        <p role="status" className="notice">
          PayPal confirme votre paiement. L&apos;abonnement sera actif d&apos;ici quelques instants :
          rechargez la page dans une minute.
        </p>
      )}
      {params.annule && <p role="status" className="notice">Paiement annulé. Aucun montant n&apos;a été prélevé.</p>}
      {params.resilie && (
        <p role="status" className="notice">Abonnement résilié. Aucun autre paiement ne sera prélevé.</p>
      )}
      {params.erreur && ERRORS[params.erreur] && (
        <p role="alert" className="notice notice-warn">{ERRORS[params.erreur]}</p>
      )}

      <section className="panel max-w-2xl">
        <h2 className="text-xl font-bold">Ma formule</h2>
        {access.kind === "essai" && (
          <p className="mt-2">Essai gratuit jusqu&apos;au {formatDateTime(access.until)}. Abonnez-vous pour continuer ensuite.</p>
        )}
        {access.kind === "abonne" && (
          <>
            <p className="mt-2">
              Formule {PLANS[access.subscription.plan].name.toLowerCase()}, {PLANS[access.subscription.plan].price}{" "}
              {access.subscription.plan === "mensuel" ? "par mois" : "par an"}, payée par PayPal.
            </p>
            {access.subscription.currentPeriodEnd && (
              <p className="hint mt-1">Prochain paiement le {formatDateTime(access.subscription.currentPeriodEnd)}.</p>
            )}
            <form action={cancelSubscription} className="mt-5">
              <input type="hidden" name="id" value={access.subscription.id} />
              <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Résiliation…">
                Résilier mon abonnement
              </SubmitButton>
              <p className="hint mt-2">Vous gardez l&apos;accès jusqu&apos;à la fin de la période payée.</p>
            </form>
          </>
        )}
        {access.kind === "resilie" && (
          <p className="mt-2">
            Abonnement résilié. Vous avez accès à Allégo jusqu&apos;au {formatDateTime(access.until)}.
          </p>
        )}
        {access.kind === "aucun" && (
          <p className="mt-2">
            Votre essai gratuit est terminé. Vos données sont conservées : abonnez-vous pour retrouver votre
            programme et votre suivi.
          </p>
        )}
      </section>

      {access.kind !== "abonne" && (
        <section>
          <h2 className="text-2xl font-bold">Choisir une formule</h2>
          {!paypalConfigured() && (
            <p className="notice notice-warn mt-4 max-w-2xl">
              Le paiement PayPal n&apos;est pas encore configuré. Renseignez les variables PAYPAL_* (voir le
              README) pour activer l&apos;abonnement.
            </p>
          )}
          <div className="mt-5 grid max-w-3xl gap-5 sm:grid-cols-2">
            {(["mensuel", "annuel"] as PlanKey[]).map((key) => {
              const plan = PLANS[key];
              const best = key === "annuel";
              return (
                <form
                  key={key}
                  action={startCheckout}
                  className={`flex flex-col rounded-2xl p-6 ${best ? "bg-citron" : "border border-brume bg-blanc"}`}
                >
                  <input type="hidden" name="plan" value={key} />
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {best && <span className="text-sm font-semibold">2 mois offerts</span>}
                  </div>
                  <p className="font-display mt-3 text-4xl font-extrabold tabular">{plan.price}</p>
                  <p className="text-grise">{plan.note}</p>
                  <SubmitButton className="btn btn-primary mt-6" pendingLabel="Ouverture de PayPal…">
                    Payer avec PayPal
                  </SubmitButton>
                </form>
              );
            })}
          </div>
          <p className="hint mt-4 max-w-2xl">
            Vous serez redirigé vers PayPal pour valider le paiement, avec votre compte PayPal ou une carte
            bancaire. L&apos;abonnement se renouvelle automatiquement et se résilie à tout moment depuis cette
            page.
          </p>
        </section>
      )}
    </div>
  );
}
