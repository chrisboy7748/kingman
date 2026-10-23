"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getAccess } from "@/lib/account";
import { refreshSubscription } from "@/lib/billing";
import { cancelPaypalSubscription, createPaypalSubscription, paypalConfigured } from "@/lib/paypal";
import { paypalPlanId } from "@/lib/plans";

function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Crée l'abonnement chez PayPal puis envoie l'utilisateur sur PayPal pour le valider. */
export async function startCheckout(formData: FormData) {
  const user = await requireUser();
  const plan = z.enum(["mensuel", "annuel"]).parse(formData.get("plan"));
  const planId = paypalPlanId(plan);
  if (!paypalConfigured() || !planId) redirect("/app/abonnement?erreur=config");

  const access = await getAccess(user.id, user.trialEndsAt);
  if (access.kind === "abonne") redirect("/app/abonnement");

  let approveUrl: string;
  try {
    const sub = await createPaypalSubscription({
      planId,
      userId: user.id,
      returnUrl: `${appUrl()}/app/abonnement/retour`,
      cancelUrl: `${appUrl()}/app/abonnement?annule=1`,
      // Les jours d'essai ou déjà payés ne sont pas perdus : PayPal ne prélève qu'à leur fin.
      startTime: access.kind === "essai" || access.kind === "resilie" ? access.until : undefined,
    });
    await db
      .insert(schema.subscriptions)
      .values({ userId: user.id, paypalSubscriptionId: sub.id, plan, status: "APPROVAL_PENDING" })
      .onConflictDoNothing();
    approveUrl = sub.approveUrl;
  } catch (err) {
    console.error("Création de l'abonnement PayPal impossible", err);
    redirect("/app/abonnement?erreur=paypal");
  }
  redirect(approveUrl);
}

export async function cancelSubscription(formData: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.userId, user.id)),
  });
  if (!sub || sub.status !== "ACTIVE") redirect("/app/abonnement");

  try {
    await cancelPaypalSubscription(sub.paypalSubscriptionId, "Résiliation demandée depuis Allégo");
    await refreshSubscription(sub.paypalSubscriptionId);
  } catch (err) {
    console.error("Résiliation PayPal impossible", err);
    redirect("/app/abonnement?erreur=resiliation");
  }
  revalidatePath("/app", "layout");
  redirect("/app/abonnement?resilie=1");
}
