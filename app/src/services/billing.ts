/**
 * Subscriptions.
 * In this web prototype purchases are simulated (no money is taken).
 * In the iPhone app this file is the only one to replace: RevenueCat
 * (Purchases.purchasePackage / restorePurchases / getCustomerInfo) with the
 * products "pro_monthly" and "pro_annual" (3-day free trial on the annual offer).
 */
import { getConfig } from './config';
import { track } from './analytics';
import { getState, setState, type Entitlement } from './store';

const DAY = 86_400_000;

export const billing = {
  entitlement(): Entitlement {
    return getState().entitlement;
  },

  async purchase(plan: 'monthly' | 'annual'): Promise<Entitlement> {
    await new Promise((r) => setTimeout(r, 900)); // store sheet
    const cfg = getConfig().pricing;
    const now = Date.now();
    const trialDays = plan === 'annual' ? cfg.annual.trialDays ?? 0 : 0;
    // The store renews automatically after the trial; the simulation never expires.
    const e: Entitlement = { active: true, plan, trialEndsAt: trialDays ? now + trialDays * DAY : undefined };
    setState({ entitlement: e });
    track(trialDays ? 'trial_started' : 'purchase', { plan });
    return e;
  },

  async restore(): Promise<Entitlement> {
    await new Promise((r) => setTimeout(r, 600));
    track('restore');
    return getState().entitlement;
  },

  /** Dev helper (settings screen): go back to the free plan. */
  reset() {
    setState({ entitlement: { active: false } });
  },
};
