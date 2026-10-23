import { NextResponse, type NextRequest } from "next/server";
import { handlePaypalEvent } from "@/lib/billing";
import { verifyPaypalWebhook } from "@/lib/paypal";

/**
 * Webhook PayPal : à déclarer dans le tableau de bord développeur PayPal
 * avec l'URL https://<votre-domaine>/api/paypal/webhook.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!(await verifyPaypalWebhook(request.headers, raw))) {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }
  try {
    const result = await handlePaypalEvent(JSON.parse(raw));
    return NextResponse.json({ result });
  } catch (err) {
    // Une réponse en erreur fait renvoyer l'événement par PayPal plus tard.
    console.error("Webhook PayPal non traité", err);
    return NextResponse.json({ error: "traitement impossible" }, { status: 500 });
  }
}
