import { describe, expect, it } from "vitest";
import { accessState, hasAccess } from "@/lib/access";
import type { Subscription } from "@/db/schema";

const now = new Date("2026-10-23T12:00:00Z");
const past = new Date("2026-10-01T00:00:00Z");
const future = new Date("2026-11-15T00:00:00Z");

function sub(status: string, currentPeriodEnd: Date | null = null): Subscription {
  return {
    id: crypto.randomUUID(),
    userId: "u",
    paypalSubscriptionId: `I-${status}`,
    plan: "mensuel",
    status,
    currentPeriodEnd,
    createdAt: past,
    updatedAt: past,
  };
}

describe("accessState", () => {
  it("donne accès pendant l'essai", () => {
    expect(accessState({ trialEndsAt: future }, [], now)).toEqual({ kind: "essai", until: future });
  });

  it("ferme l'accès à la fin de l'essai sans abonnement", () => {
    const state = accessState({ trialEndsAt: past }, [sub("APPROVAL_PENDING"), sub("SUSPENDED", future)], now);
    expect(state.kind).toBe("aucun");
    expect(hasAccess(state)).toBe(false);
  });

  it("donne accès avec un abonnement actif, même pendant l'essai", () => {
    expect(accessState({ trialEndsAt: future }, [sub("ACTIVE", future)], now).kind).toBe("abonne");
  });

  it("garde l'accès après résiliation jusqu'à la fin de la période payée", () => {
    expect(accessState({ trialEndsAt: past }, [sub("CANCELLED", future)], now)).toMatchObject({ kind: "resilie", until: future });
    expect(accessState({ trialEndsAt: past }, [sub("CANCELLED", past)], now).kind).toBe("aucun");
  });
});
