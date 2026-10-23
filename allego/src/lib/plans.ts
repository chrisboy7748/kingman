export type PlanKey = "mensuel" | "annuel";

export const TRIAL_DAYS = 7;

const MONTHLY = 12.99;
const YEARLY = 99.99;

export function formatEuros(amount: number) {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/** Économie de la formule annuelle par rapport à 12 mois de formule mensuelle, en %. */
const YEARLY_SAVING = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100);

export const PLANS: Record<
  PlanKey,
  {
    name: string;
    price: string;
    amount: number;
    interval: "MONTH" | "YEAR";
    monthlyEquivalent: number;
    note: string;
    badge?: string;
  }
> = {
  mensuel: {
    name: "Mensuel",
    price: formatEuros(MONTHLY),
    amount: MONTHLY,
    interval: "MONTH",
    monthlyEquivalent: MONTHLY,
    note: "par mois, sans engagement",
  },
  annuel: {
    name: "Annuel",
    price: formatEuros(YEARLY),
    amount: YEARLY,
    interval: "YEAR",
    monthlyEquivalent: YEARLY / 12,
    note: `par an, soit ${formatEuros(Math.round((YEARLY / 12) * 100) / 100)} par mois`,
    badge: `${YEARLY_SAVING} % moins cher`,
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
