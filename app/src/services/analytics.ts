/**
 * Analytics stub — the 5 weekly KPIs of the spec:
 * downloads (app_open first time), % exporting (export_done), % starting a trial (trial_started),
 * trial → paid (purchase), churn (from the store / RevenueCat).
 * Plug Firebase Analytics or Mixpanel here: every call goes through track().
 */
type Props = Record<string, string | number | boolean | undefined>;

export function track(event: string, props: Props = {}) {
  try {
    const key = 'lamsa.analytics';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    data[event] = (data[event] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
  if (import.meta.env.DEV) console.debug('[track]', event, props);
  // window.mixpanel?.track(event, props)  /  logEvent(analytics, event, props)
}

export function localCounters(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('lamsa.analytics') || '{}');
  } catch {
    return {};
  }
}
