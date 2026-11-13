/**
 * Template catalog — fetched at runtime from the URL in config.json, so new templates
 * appear in the app without any App Store update. Templates published from the
 * back-office "on this device" (IndexedDB) are merged in for testing.
 */
import type { Catalog, CategoryId, LottieAnimation, TemplateManifest, Usage } from '../engine/types';
import { getConfig } from './config';
import { db } from './db';

export interface LocalTemplate {
  manifest: TemplateManifest;
  lottie: LottieAnimation;
}

let catalogPromise: Promise<TemplateManifest[]> | null = null;
const lottieCache = new Map<string, Promise<LottieAnimation>>();
let baseUrl = '';

export function loadCatalog(force = false): Promise<TemplateManifest[]> {
  if (!catalogPromise || force) {
    catalogPromise = (async () => {
      const url = new URL(getConfig().catalogUrl, location.href);
      baseUrl = url.href.replace(/[^/]*$/, '');
      let remote: TemplateManifest[] = [];
      try {
        const res = await fetch(url.href, { cache: 'no-cache' });
        remote = ((await res.json()) as Catalog).templates;
      } catch (e) {
        console.warn('catalog unavailable', e);
      }
      let local: LocalTemplate[] = [];
      try {
        local = await db.all<LocalTemplate>('localTemplates');
      } catch {
        /* no IndexedDB */
      }
      for (const l of local) lottieCache.set(l.manifest.id, Promise.resolve(l.lottie));
      const localIds = new Set(local.map((l) => l.manifest.id));
      return [...local.map((l) => l.manifest), ...remote.filter((t) => !localIds.has(t.id))];
    })();
  }
  return catalogPromise;
}

export function loadTemplate(m: TemplateManifest): Promise<LottieAnimation> {
  const key = `${m.id}@${m.version}`;
  let p = lottieCache.get(key) || lottieCache.get(m.id);
  if (!p) {
    p = fetch(new URL(m.file, baseUrl || location.href).href).then((r) => {
      if (!r.ok) throw new Error(`template ${m.id}: ${r.status}`);
      return r.json();
    });
    lottieCache.set(key, p);
    p.catch(() => lottieCache.delete(key));
  }
  return p;
}

/** Makes an in-memory template available to loadTemplate() (back-office preview). */
export function registerTemplate(m: Pick<TemplateManifest, 'id' | 'version'>, lottie: LottieAnimation) {
  lottieCache.set(`${m.id}@${m.version}`, Promise.resolve(lottie));
}

/** Resolves a sample photo path relative to the catalog. */
export const sampleUrl = (path: string) => (/^(blob:|data:|https?:)/.test(path) ? path : new URL(path, location.href).href);

export const CATEGORIES: { id: CategoryId; name: { en: string; ar: string }; emoji: string }[] = [
  { id: 'real-estate', name: { en: 'Real estate', ar: 'العقارات' }, emoji: '🏠' },
  { id: 'promos', name: { en: 'Promos & sales', ar: 'العروض والتخفيضات' }, emoji: '🏷️' },
  { id: 'food', name: { en: 'Food & restaurants', ar: 'المطاعم' }, emoji: '🍽️' },
  { id: 'beauty', name: { en: 'Beauty & fashion', ar: 'الجمال والموضة' }, emoji: '💄' },
  { id: 'events', name: { en: 'Celebrations', ar: 'المناسبات' }, emoji: '🌙' },
  { id: 'quotes', name: { en: 'Texts & quotes', ar: 'نصوص واقتباسات' }, emoji: '💬' },
];

const AFFINITY: Record<Usage, CategoryId[]> = {
  'real-estate': ['real-estate', 'events', 'promos', 'quotes', 'food', 'beauty'],
  retail: ['promos', 'food', 'beauty', 'events', 'quotes', 'real-estate'],
  creator: ['quotes', 'beauty', 'events', 'promos', 'food', 'real-estate'],
  personal: ['events', 'quotes', 'beauty', 'food', 'promos', 'real-estate'],
};

/** Categories ordered for the onboarding answer. */
export const categoriesFor = (u: Usage) => AFFINITY[u].map((id) => CATEGORIES.find((c) => c.id === id)!);

/** Relevance score for sorting: templates of the user's profile first. */
export function relevance(t: TemplateManifest, u: Usage) {
  return (t.usages.includes(u) ? 1000 : 0) + (6 - AFFINITY[u].indexOf(t.category)) * 50 + t.trending;
}

export function newThisWeek(all: TemplateManifest[]) {
  if (!all.length) return [];
  const latest = Math.max(...all.map((t) => Date.parse(t.publishedAt) || 0));
  return all.filter((t) => (Date.parse(t.publishedAt) || 0) > latest - 7 * 86_400_000);
}
