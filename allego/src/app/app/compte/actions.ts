"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { endSession, requireUser, verifyPassword } from "@/lib/auth";
import { cancelPaypalSubscription } from "@/lib/paypal";
import type { FormState } from "@/app/(auth)/actions";

/** Supprime le compte et toutes ses données, après avoir arrêté l'abonnement PayPal. */
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Mot de passe incorrect. Votre compte n'a pas été supprimé." };
  }

  const active = await db.query.subscriptions.findMany({
    where: and(eq(schema.subscriptions.userId, user.id), eq(schema.subscriptions.status, "ACTIVE")),
  });
  for (const sub of active) {
    try {
      await cancelPaypalSubscription(sub.paypalSubscriptionId, "Suppression du compte Allégo");
    } catch (err) {
      console.error("Résiliation PayPal impossible avant suppression", err);
      return {
        error:
          "Votre abonnement PayPal n'a pas pu être résilié, le compte n'a donc pas été supprimé. Réessayez, ou résiliez d'abord depuis votre compte PayPal.",
      };
    }
  }

  // Les suppressions en cascade effacent profil, pesées, journal, activités et abonnements.
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  await endSession();
  redirect("/");
}
