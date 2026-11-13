/**
 * Remote configuration — fetched at launch, so prices, trial length and the catalog
 * location can change without an App Store update (RevenueCat-style price tests).
 */
export const APP_NAME = 'Lamsa';

export interface PlanConfig {
  id: string;
  price: number;
  aed: number;
  trialDays?: number;
}

export interface AppConfig {
  appName: string;
  catalogUrl: string;
  pricing: { currency: string; monthly: PlanConfig; annual: PlanConfig };
  links: { terms: string; privacy: string; support: string };
}

export const DEFAULT_CONFIG: AppConfig = {
  appName: APP_NAME,
  catalogUrl: 'catalog/catalog.json',
  pricing: {
    currency: 'USD',
    monthly: { id: 'pro_monthly', price: 10.99, aed: 40 },
    annual: { id: 'pro_annual', price: 54.99, aed: 200, trialDays: 3 },
  },
  links: { terms: 'legal/terms.html', privacy: 'legal/privacy.html', support: 'mailto:support@example.com' },
};

let current: AppConfig = DEFAULT_CONFIG;

export async function loadConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('config.json', { cache: 'no-cache' });
    if (res.ok) current = { ...DEFAULT_CONFIG, ...(await res.json()) };
  } catch {
    /* offline: defaults */
  }
  return current;
}

export const getConfig = () => current;
