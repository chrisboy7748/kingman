import { useEffect, useState, useSyncExternalStore } from 'react';
import type { TemplateManifest } from '../engine/types';
import { useT, type Key } from '../i18n';
import { getConfig } from '../services/config';
import { track } from '../services/analytics';
import { billing } from '../services/billing';
import { isPro, useAppState } from '../services/store';

// ---- icons -------------------------------------------------------------------

const P = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  brand: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  gear: 'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 4a7 7 0 1 0 4.4 12.4L20 21l1-1-4.6-4.6A7 7 0 0 0 11 4z',
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  sound: 'M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
  mute: 'M4 9v6h4l5 4V5L8 9zm12 0 4 6m0-6-4 6',
  image: 'M4 5h16v14H4zm2 12h12l-4-5-3 4-2-2z',
  text: 'M5 5h14v3h-2V7h-4v10h2v2H9v-2h2V7H7v1H5z',
  palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5S13 18 13 17.3c0-.8.7-1.3 1.5-1.3H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8z',
  music: 'M9 17a3 3 0 1 1-2-2.8V5l12-2v11a3 3 0 1 1-2-2.8V6.3l-8 1.4z',
  check: 'M5 12l5 5L20 7',
  plus: 'M12 5v14M5 12h14',
  crown: 'M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5z',
  share: 'M12 3v12M7 8l5-5 5 5M5 13v6h14v-6',
  download: 'M12 3v12m-5-5 5 5 5-5M5 21h14',
  copy: 'M8 8h11v13H8zM5 3h11v3H6v11H5z',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3',
  sparkle: 'M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z',
  logo: 'M4 4h16v16H4zm4 4v8h8V8z',
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 22, stroke }: { name: IconName; size?: number; stroke?: boolean }) {
  const strokeIcons: IconName[] = ['back', 'close', 'check', 'plus', 'share', 'download', 'trash', 'mute'];
  const isStroke = stroke ?? strokeIcons.includes(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`icon icon-${name}`}
      fill={isStroke ? 'none' : 'currentColor'} stroke={isStroke ? 'currentColor' : 'none'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name]} />
    </svg>
  );
}

export function ProBadge({ small }: { small?: boolean }) {
  return <span className={`badge-pro ${small ? 'small' : ''}`}><Icon name="crown" size={small ? 10 : 12} /> PRO</span>;
}

export function Sheet({ open, onClose, children, title, full }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; full?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${full ? 'full' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sheet-grip" />
          {title && <h2>{title}</h2>}
          <button className="icon-btn ghost" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="toast" role="status">{text}</div>;
}

export function useToast(): [string | null, (s: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 2200);
    return () => clearTimeout(t);
  }, [text]);
  return [text, setText];
}

export const fmtDuration = (m: TemplateManifest) => `${Math.round(m.duration)}`;

// ---- paywall controller --------------------------------------------------------

export type PaywallReason = 'template' | 'watermark' | 'quality' | 'brand' | 'music';

let pending: { reason: PaywallReason; resolve: (ok: boolean) => void } | null = null;
const pwListeners = new Set<() => void>();
const emit = () => pwListeners.forEach((l) => l());

/** Opens the paywall; resolves true if the user is (now) Pro. */
export function requirePro(reason: PaywallReason): Promise<boolean> {
  if (isPro()) return Promise.resolve(true);
  track('paywall_shown', { reason });
  return new Promise((resolve) => {
    pending?.resolve(false);
    pending = { reason, resolve };
    emit();
  });
}

export function PaywallHost() {
  const current = useSyncExternalStore(
    (l) => (pwListeners.add(l), () => pwListeners.delete(l)),
    () => pending,
  );
  if (!current) return null;
  const close = (ok: boolean) => {
    current.resolve(ok);
    pending = null;
    emit();
  };
  return <Paywall reason={current.reason} onClose={close} />;
}

function Paywall({ reason, onClose }: { reason: PaywallReason; onClose: (ok: boolean) => void }) {
  const { t, lang } = useT();
  const pricing = getConfig().pricing;
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [busy, setBusy] = useState(false);
  const pro = useAppState((s) => isPro(s));
  const perMonth = (pricing.annual.price / 12).toFixed(2);
  const money = (n: number) => (lang === 'ar' ? `${n.toFixed(2)} $` : `$${n.toFixed(2)}`);

  const buy = async () => {
    setBusy(true);
    try {
      await billing.purchase(plan);
      onClose(true);
    } finally {
      setBusy(false);
    }
  };

  const reasonKey: Key = `pw.why.${reason}` as Key;
  const features: Key[] = ['pw.f1', 'pw.f2', 'pw.f3', 'pw.f4', 'pw.f5'];

  return (
    <div className="paywall" role="dialog" aria-modal="true">
      <button className="icon-btn ghost paywall-close" onClick={() => onClose(pro)} aria-label={t('m.close')}><Icon name="close" /></button>
      <div className="paywall-hero">
        <div className="paywall-orb"><Icon name="crown" size={34} /></div>
        <p className="paywall-reason">{t(reasonKey)}</p>
        <h1>{t('pw.title')}</h1>
      </div>
      <ul className="paywall-features">
        {features.map((f) => (
          <li key={f}><span className="tick"><Icon name="check" size={16} /></span>{t(f)}</li>
        ))}
      </ul>
      <div className="plans">
        <button className={`plan ${plan === 'annual' ? 'on' : ''}`} onClick={() => setPlan('annual')}>
          <span className="plan-flag">{t('pw.best')}</span>
          <span className="plan-name">{t('pw.annual')}</span>
          <span className="plan-price">{money(pricing.annual.price)} <small>{t('pw.perYear')}</small></span>
          <span className="plan-sub">≈ {money(+perMonth)} {t('pw.perMonth')} · {pricing.annual.aed} AED · {t('pw.trial')}</span>
        </button>
        <button className={`plan ${plan === 'monthly' ? 'on' : ''}`} onClick={() => setPlan('monthly')}>
          <span className="plan-name">{t('pw.monthly')}</span>
          <span className="plan-price">{money(pricing.monthly.price)} <small>{t('pw.perMonth')}</small></span>
          <span className="plan-sub">≈ {pricing.monthly.aed} AED</span>
        </button>
      </div>
      <button className="btn primary big" onClick={buy} disabled={busy}>
        {busy ? t('m.loading') : plan === 'annual' ? t('pw.ctaTrial') : t('pw.cta')}
      </button>
      <p className="legal">{t('pw.legal', { price: `${money(plan === 'annual' ? pricing.annual.price : pricing.monthly.price)}${plan === 'annual' ? t('pw.perYear') : t('pw.perMonth')}` })}</p>
      <div className="paywall-links">
        <button className="link" onClick={async () => { setBusy(true); const e = await billing.restore(); setBusy(false); if (e.active) onClose(true); }}>{t('pw.restore')}</button>
        <a className="link" href={getConfig().links.terms} target="_blank" rel="noreferrer">{t('pw.terms')}</a>
        <a className="link" href={getConfig().links.privacy} target="_blank" rel="noreferrer">{t('pw.privacy')}</a>
      </div>
      <p className="legal dim">{t('pw.simulated')}</p>
    </div>
  );
}
