// Crée chez PayPal le produit Allégo et ses deux plans d'abonnement, puis affiche
// les variables à copier dans .env. À lancer une fois en sandbox, puis une fois en live.
//
//   npm run paypal:setup

import "dotenv/config";
import { paypalRequest } from "../src/lib/paypal";
import { PLANS, type PlanKey } from "../src/lib/plans";

async function main() {
  const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  console.log(`Configuration PayPal (${env})…`);

  const product = await paypalRequest<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Allégo",
      description: "Accompagnement à la perte de poids",
      type: "SERVICE",
      category: "HEALTH_AND_NUTRITION",
    }),
  });
  console.log(`Produit créé : ${product.id}`);

  const ids: Record<PlanKey, string> = { mensuel: "", annuel: "" };
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
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 2,
        },
      }),
    });
    ids[key] = created.id;
    console.log(`Plan ${plan.name} créé : ${created.id}`);
  }

  console.log("\nAjoutez ces lignes à votre .env (ou aux variables de l'hébergeur) :\n");
  console.log(`PAYPAL_PLAN_MONTHLY=${ids.mensuel}`);
  console.log(`PAYPAL_PLAN_YEARLY=${ids.annuel}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
