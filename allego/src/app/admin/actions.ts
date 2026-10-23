"use server";

import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { createPaypalPlans, createPaypalWebhook } from "@/lib/paypal-setup";
import { appUrl } from "@/lib/url";

export type SetupState = { error?: string; variables?: [string, string][]; note?: string } | null;

/** Crée chez PayPal les formules et le webhook, et renvoie les variables à recopier dans Vercel. */
export async function setupPaypal(_: SetupState): Promise<SetupState> {
  const me = await requireUser();
  if (!isAdmin(me.email)) notFound();
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return { error: "Ajoutez d'abord PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET dans Vercel, puis redéployez." };
  }

  const variables: [string, string][] = [];
  try {
    if (!process.env.PAYPAL_PLAN_MONTHLY || !process.env.PAYPAL_PLAN_YEARLY) {
      const plans = await createPaypalPlans();
      variables.push(["PAYPAL_PLAN_MONTHLY", plans.mensuel], ["PAYPAL_PLAN_YEARLY", plans.annuel]);
    }
    const url = `${appUrl()}/api/paypal/webhook`;
    if (!process.env.PAYPAL_WEBHOOK_ID) {
      if (!url.startsWith("https://")) {
        return { variables, note: `Le webhook n'a pas été créé : ${url} n'est pas une adresse publique en https. Refaites cette étape sur le site en ligne.` };
      }
      variables.push(["PAYPAL_WEBHOOK_ID", await createPaypalWebhook(url)]);
    }
  } catch (err) {
    console.error("Configuration PayPal impossible", err);
    const detail = err instanceof Error ? err.message : String(err);
    return {
      variables,
      error: detail.includes("Authentification")
        ? "PayPal refuse les clés : vérifiez PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET et PAYPAL_ENV (sandbox ou live)."
        : `PayPal a refusé la demande : ${detail.slice(0, 200)}`,
    };
  }
  return { variables };
}
