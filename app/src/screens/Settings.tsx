import type { Usage } from '../engine/types';
import { useT } from '../i18n';
import { billing } from '../services/billing';
import { getConfig } from '../services/config';
import { isPro, setState, useAppState } from '../services/store';
import { ProBadge, requirePro } from '../ui/common';

const USAGES: Usage[] = ['real-estate', 'retail', 'creator', 'personal'];

export function Settings() {
  const { t, lang } = useT();
  const usage = useAppState((s) => s.usage);
  const ent = useAppState((s) => s.entitlement);
  const pro = useAppState((s) => isPro(s));
  const links = getConfig().links;

  return (
    <div className="screen settings">
      <header className="topbar"><h1>{t('nav.settings')}</h1></header>

      <section className="card">
        <h2>{t('s.subscription')}</h2>
        {pro ? (
          <p><ProBadge /> {ent.plan === 'annual' ? t('pw.annual') : t('pw.monthly')}
            {ent.trialEndsAt && <span className="dim small"> · {t('s.trialUntil')} {new Date(ent.trialEndsAt).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB')}</span>}
          </p>
        ) : (
          <>
            <p className="dim">{t('s.free')}</p>
            <button className="btn primary" onClick={() => requirePro('template')}>{t('s.upgrade')}</button>
          </>
        )}
        <div className="row-btns">
          <button className="btn small" onClick={() => billing.restore()}>{t('s.restore')}</button>
          {pro && <button className="btn small ghost" onClick={() => billing.reset()}>{t('s.resetSub')}</button>}
        </div>
      </section>

      <section className="card">
        <h2>{t('s.language')}</h2>
        <div className="seg">
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setState({ lang: 'en' })}>English</button>
          <button className={lang === 'ar' ? 'on' : ''} onClick={() => setState({ lang: 'ar' })}>العربية</button>
        </div>
      </section>

      <section className="card">
        <h2>{t('s.usage')}</h2>
        <div className="chips wrap">
          {USAGES.map((u) => (
            <button key={u} className={`chip ${usage === u ? 'on' : ''}`} onClick={() => setState({ usage: u })}>{t(`ob.usage.${u}` as any)}</button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('s.legal')}</h2>
        <div className="link-list">
          <a href={links.terms} target="_blank" rel="noreferrer">{t('pw.terms')}</a>
          <a href={links.privacy} target="_blank" rel="noreferrer">{t('pw.privacy')}</a>
          <a href="admin.html">{t('s.admin')}</a>
          <button className="link" onClick={() => setState({ onboarded: false })}>{t('s.onboarding')}</button>
        </div>
        <p className="dim small">{t('s.version')} 0.1.0 · prototype</p>
      </section>
    </div>
  );
}
