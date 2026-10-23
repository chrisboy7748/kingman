import type { Subscription, User } from "@/db/schema";

export type AccessState =
  | { kind: "essai"; until: Date }
  | { kind: "abonne"; subscription: Subscription }
  | { kind: "resilie"; subscription: Subscription; until: Date }
  | { kind: "aucun" };

/**
 * Détermine si un compte a accès à l'application :
 * pendant l'essai gratuit, avec un abonnement actif, ou après une résiliation
 * jusqu'à la fin de la période déjà payée.
 */
export function accessState(user: Pick<User, "trialEndsAt">, subs: Subscription[], now = new Date()): AccessState {
  const active = subs.find((s) => s.status === "ACTIVE");
  if (active) return { kind: "abonne", subscription: active };

  const paidUntil = subs
    .filter((s) => s.status === "CANCELLED" && s.currentPeriodEnd && s.currentPeriodEnd > now)
    .sort((a, b) => b.currentPeriodEnd!.getTime() - a.currentPeriodEnd!.getTime())[0];
  if (paidUntil) return { kind: "resilie", subscription: paidUntil, until: paidUntil.currentPeriodEnd! };

  if (user.trialEndsAt > now) return { kind: "essai", until: user.trialEndsAt };
  return { kind: "aucun" };
}

export function hasAccess(state: AccessState) {
  return state.kind !== "aucun";
}
