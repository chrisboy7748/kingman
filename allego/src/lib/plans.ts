export type PlanKey = "mensuel" | "annuel";

export const TRIAL_DAYS = 7;

export const PLANS: Record<
  PlanKey,
  { name: string; price: string; amount: number; interval: "MONTH" | "YEAR"; monthlyEquivalent: number; note: string }
> = {
  mensuel: {
    name: "Mensuel",
    price: "9,99 €",
    amount: 9.99,
    interval: "MONTH",
    monthlyEquivalent: 9.99,
    note: "par mois, sans engagement",
  },
  annuel: {
    name: "Annuel",
    price: "79,99 €",
    amount: 79.99,
    interval: "YEAR",
    monthlyEquivalent: 79.99 / 12,
    note: "par an, soit 6,67 € par mois",
  },
};

/** ID du plan PayPal correspondant, défini par `npm run paypal:setup`. */
export function paypalPlanId(plan: PlanKey): string | undefined {
  return plan === "mensuel" ? process.env.PAYPAL_PLAN_MONTHLY : process.env.PAYPAL_PLAN_YEARLY;
}

export function planFromPaypalId(planId: string): PlanKey | null {
  if (planId && planId === process.env.PAYPAL_PLAN_MONTHLY) return "mensuel";
  if (planId && planId === process.env.PAYPAL_PLAN_YEARLY) return "annuel";
  return null;
}
