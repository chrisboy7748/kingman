import { useSyncExternalStore } from 'react';

/** Hash router: #/ · #/t/:id · #/edit/:projectId · #/projects · #/brand · #/settings */
let depth = 0; // in-app history entries we pushed

export function navigate(path: string, replace = false) {
  const url = `#${path}`;
  if (replace) history.replaceState(null, '', url);
  else {
    history.pushState(null, '', url);
    depth++;
  }
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Goes back inside the app, or to `fallback` when the page was opened directly. */
export function back(fallback = '/') {
  if (depth > 0) history.back();
  else navigate(fallback, true);
}

if (typeof window !== 'undefined') window.addEventListener('popstate', () => (depth = Math.max(0, depth - 1)));

const sub = (l: () => void) => {
  window.addEventListener('hashchange', l);
  window.addEventListener('popstate', l);
  return () => {
    window.removeEventListener('hashchange', l);
    window.removeEventListener('popstate', l);
  };
};

export function useRoute(): string[] {
  const hash = useSyncExternalStore(sub, () => location.hash);
  const path = hash.replace(/^#/, '') || '/';
  return path.split('/').filter(Boolean).map(decodeURIComponent);
}
