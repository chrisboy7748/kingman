// Création, chez PayPal, de tout ce dont Allégo a besoin : le produit, les deux formules
// d'abonnement et le webhook. Utilisé par la page Administration et par `npm run paypal:setup`.

import { paypalRequest } from "./paypal";
import { PLANS, type PlanKey } from "./plans";

export const WEBHOOK_EVENTS = [
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "PAYMENT.SALE.COMPLETED",
];

/** Crée le produit et les formules mensuelle et annuelle, et renvoie l'ID PayPal de chaque formule. */
export async function createPaypalPlans(): Promise<Record<PlanKey, string>> {
  const product = await paypalRequest<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Allégo",
      description: "Accompagnement à la perte de poids",
      type: "SERVICE",
      category: "HEALTH_AND_NUTRITION",
    }),
  });

  const ids = {} as Record<PlanKey, string>;
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    const plan = PLANS[key];
    const created = await paypalRequest<{ id: string }>("/v1/billing/plans", {
      method: "POST",
      body: JSON.stringify({
        product_id: product.id,
        name: `Allégo ${plan.name}`,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: plan.interval, interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: plan.amount.toFixed(2), currency_code: "EUR" } },
          },
        ],
        payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
      }),
    });
    ids[key] = created.id;
  }
  return ids;
}

/** Déclare le webhook d'Allégo chez PayPal et renvoie son ID. L'URL doit être publique et en https. */
export async function createPaypalWebhook(url: string): Promise<string> {
  const webhook = await paypalRequest<{ id: string }>("/v1/notifications/webhooks", {
    method: "POST",
    body: JSON.stringify({ url, event_types: WEBHOOK_EVENTS.map((name) => ({ name })) }),
  });
  return webhook.id;
}
