import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncSubscription } from "@/lib/billing";
import { getPaypalSubscription } from "@/lib/paypal";

/** PayPal renvoie ici l'utilisateur après qu'il a validé son abonnement. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const id = request.nextUrl.searchParams.get("subscription_id");
  if (!id) redirect("/app/abonnement");

  let ok = false;
  try {
    const sub = await getPaypalSubscription(id);
    // On ne rattache un abonnement qu'au compte qui l'a créé.
    if (sub.custom_id === user.id) {
      await syncSubscription(sub);
      ok = true;
    }
  } catch (err) {
    console.error("Lecture de l'abonnement PayPal impossible", err);
  }
  redirect(ok ? "/app/abonnement?merci=1" : "/app/abonnement?erreur=retour");
}
