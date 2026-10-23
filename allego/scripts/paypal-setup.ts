// Crée chez PayPal le produit Allégo, ses deux formules et, si APP_URL est une adresse https,
// le webhook. Affiche ensuite les variables à recopier. Le même réglage existe en un clic
// dans la page Administration du site.
//
//   npm run paypal:setup

import "dotenv/config";
import { createPaypalPlans, createPaypalWebhook } from "../src/lib/paypal-setup";
import { appUrl } from "../src/lib/url";

async function main() {
  console.log(`Configuration PayPal (${process.env.PAYPAL_ENV === "live" ? "live" : "sandbox"})…`);
  const plans = await createPaypalPlans();
  console.log("\nAjoutez ces variables à votre .env ou chez votre hébergeur :\n");
  console.log(`PAYPAL_PLAN_MONTHLY=${plans.mensuel}`);
  console.log(`PAYPAL_PLAN_YEARLY=${plans.annuel}`);
  const url = `${appUrl()}/api/paypal/webhook`;
  if (url.startsWith("https://")) {
    console.log(`PAYPAL_WEBHOOK_ID=${await createPaypalWebhook(url)}`);
  } else {
    console.log(`\nWebhook non créé : ${url} n'est pas une adresse publique en https.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
