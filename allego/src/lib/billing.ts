import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Subscription, User } from "@/db/schema";
import { sendEmailSafely } from "@/lib/email";
import { paymentFailedEmail, subscriptionActiveEmail, subscriptionCancelledEmail } from "@/lib/email-templates";
import { getPaypalSubscription, type PaypalSubscription } from "@/lib/paypal";
import { PLANS, planFromPaypalId, type PlanKey } from "@/lib/plans";

function addInterval(from: Date, plan: PlanKey) {
  const d = new Date(from);
  if (PLANS[plan].interval === "MONTH") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

/**
 * Recopie en base l'état d'un abonnement tel que PayPal le décrit.
 * PayPal reste la source de vérité : on relit toujours l'abonnement chez PayPal
 * plutôt que de faire confiance au contenu d'un webhook ou d'une URL.
 */
export async function syncSubscription(sub: PaypalSubscription): Promise<Subscription | null> {
  const plan = planFromPaypalId(sub.plan_id);
  if (!plan) throw new Error(`Plan PayPal inconnu : ${sub.plan_id}`);
  const userId = sub.custom_id;
  if (!userId) throw new Error(`Abonnement ${sub.id} sans custom_id`);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  // Compte supprimé entre-temps : ses abonnements ont été résiliés avant la suppression.
  if (!user) return null;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.paypalSubscriptionId, sub.id),
  });

  // Après une résiliation PayPal ne donne plus de prochaine échéance :
  // on garde alors la fin de période connue, ou on la déduit du dernier paiement.
  const next = sub.billing_info?.next_billing_time;
  const lastPayment = sub.billing_info?.last_payment?.time;
  const currentPeriodEnd = next
    ? new Date(next)
    : (existing?.currentPeriodEnd ?? (lastPayment ? addInterval(new Date(lastPayment), plan) : null));

  const values = { userId, plan, status: sub.status, currentPeriodEnd, updatedAt: new Date() };
  const [row] = await db
    .insert(schema.subscriptions)
    .values({ paypalSubscriptionId: sub.id, ...values })
    .onConflictDoUpdate({ target: schema.subscriptions.paypalSubscriptionId, set: values })
    .returning();
  await notifyStatusChange(row, user);
  return row;
}

/**
 * Prévient l'abonné quand son abonnement devient actif, est résilié ou suspendu.
 * La mise à jour conditionnelle garantit un seul e-mail par changement de statut,
 * même si le retour de PayPal et le webhook arrivent en même temps.
 */
async function notifyStatusChange(sub: Subscription, user: User) {
  const [claimed] = await db
    .update(schema.subscriptions)
    .set({ notifiedStatus: sub.status })
    .where(and(eq(schema.subscriptions.id, sub.id), sql`${schema.subscriptions.notifiedStatus} IS DISTINCT FROM ${sub.status}`))
    .returning({ id: schema.subscriptions.id });
  if (!claimed) return;

  if (sub.status === "ACTIVE") await sendEmailSafely(subscriptionActiveEmail(user, sub.plan, sub.currentPeriodEnd));
  else if (sub.status === "CANCELLED") await sendEmailSafely(subscriptionCancelledEmail(user, sub.currentPeriodEnd));
  else if (sub.status === "SUSPENDED") await sendEmailSafely(paymentFailedEmail(user));
}

export async function refreshSubscription(paypalSubscriptionId: string) {
  return syncSubscription(await getPaypalSubscription(paypalSubscriptionId));
}

type WebhookEvent = {
  id: string;
  event_type: string;
  resource: {
    id?: string;
    billing_agreement_id?: string;
    amount?: { total?: string; currency?: string };
    create_time?: string;
  };
};

const SUBSCRIPTION_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
]);

/** Traite un webhook PayPal déjà authentifié. Rejouer le même événement est sans effet. */
export async function handlePaypalEvent(event: WebhookEvent): Promise<"traite" | "deja_traite" | "ignore"> {
  const seen = await db.query.paypalEvents.findFirst({ where: eq(schema.paypalEvents.id, event.id) });
  if (seen) return "deja_traite";

  let outcome: "traite" | "ignore" = "ignore";
  if (SUBSCRIPTION_EVENTS.has(event.event_type) && event.resource.id) {
    await refreshSubscription(event.resource.id);
    outcome = "traite";
  } else if (event.event_type === "PAYMENT.SALE.COMPLETED" && event.resource.billing_agreement_id) {
    const r = event.resource;
    await db
      .insert(schema.payments)
      .values({
        id: r.id!,
        paypalSubscriptionId: r.billing_agreement_id!,
        amount: Number(r.amount?.total ?? 0),
        currency: r.amount?.currency ?? "EUR",
        paidAt: r.create_time ? new Date(r.create_time) : new Date(),
      })
      .onConflictDoNothing();
    await refreshSubscription(r.billing_agreement_id!);
    outcome = "traite";
  }

  await db.insert(schema.paypalEvents).values({ id: event.id, type: event.event_type }).onConflictDoNothing();
  return outcome;
}
