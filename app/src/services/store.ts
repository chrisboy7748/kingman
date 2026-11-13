/** App-wide persisted state (settings, brand kit, subscription) with a tiny React binding. */
import { useSyncExternalStore } from 'react';
import type { FontFamily, Lang, Usage } from '../engine/types';

export interface BrandKit {
  logoBlobId?: string;
  colors: string[];
  font?: FontFamily;
}

export interface Entitlement {
  active: boolean;
  plan?: 'monthly' | 'annual';
  /** ms timestamps */
  trialEndsAt?: number;
  renewsAt?: number;
}

export interface AppState {
  onboarded: boolean;
  usage: Usage;
  lang: Lang;
  brand: BrandKit;
  entitlement: Entitlement;
}

const KEY = 'lamsa.state.v1';

const initial: AppState = {
  onboarded: false,
  usage: 'real-estate',
  lang: 'en',
  brand: { colors: [] },
  entitlement: { active: false },
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch {
    /* private mode */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return { ...initial, lang: nav.startsWith('ar') ? 'ar' : 'en' };
}

let state: AppState = load();
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

export const isPro = (s: AppState = state) => {
  const e = s.entitlement;
  if (!e.active) return false;
  if (e.renewsAt && e.renewsAt < Date.now()) return false;
  return true;
};
