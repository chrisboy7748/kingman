import { useMemo, useState } from 'react';
import type { Lang, TemplateManifest, Usage } from '../engine/types';
import { useT } from '../i18n';
import { track } from '../services/analytics';
import { putBlob } from '../services/db';
import { setState, useAppState } from '../services/store';
import { Icon } from '../ui/common';
import { Player, useResolved } from '../ui/Player';
import { previewContent, useBrandLogo } from '../ui/TemplateCard';

const USAGES: { id: Usage; icon: string }[] = [
  { id: 'real-estate', icon: '🏠' },
  { id: 'retail', icon: '🛍️' },
  { id: 'creator', icon: '🎬' },
  { id: 'personal', icon: '🎉' },
];

const SWATCHES = ['#0E1A2B', '#C9A227', '#1F6F5C', '#E63946', '#FF4D5A', '#6C2BD9', '#F2A541', '#B76E79', '#14213D', '#FFFFFF'];

export function Onboarding({ templates }: { templates: TemplateManifest[] }) {
  const { t, lang } = useT();
  const [step, setStep] = useState(0);
  const usage = useAppState((s) => s.usage);
  const brand = useAppState((s) => s.brand);
  const logo = useBrandLogo();

  const showcase = templates.find((x) => x.id === 'just-listed') || templates[0];
  const content = useMemo(() => (showcase ? previewContent(showcase, lang, logo) : null), [showcase, lang, logo]);
  const { animation } = useResolved(showcase, content, 0.6);

  const setLang = (l: Lang) => setState({ lang: l });
  const finish = () => {
    setState({ onboarded: true });
    track('onboarding_done', { usage, lang, brand: !!brand.logoBlobId });
  };

  const onLogo = async (f: File | undefined) => {
    if (!f) return;
    const id = await putBlob(f);
    setState((s) => ({ brand: { ...s.brand, logoBlobId: id } }));
  };
  const setColor = (i: number, c: string) =>
    setState((s) => {
      const colors = [...s.brand.colors];
      colors[i] = c;
      return { brand: { ...s.brand, colors: colors.filter(Boolean).slice(0, 3) } };
    });

  return (
    <div className="screen onboarding">
      <div className="ob-dots" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <div className="ob-step">
          <div className="ob-showcase">
            {showcase && <Player animation={animation} aspect={showcase.width / showcase.height} dpr={1.5} />}
          </div>
          <h1>{t('ob.welcome')}</h1>
          <p className="dim">{t('ob.welcomeSub')}</p>
          <p className="label">{t('ob.language')}</p>
          <div className="seg">
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
            <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')} lang="ar">العربية</button>
          </div>
          <button className="btn primary big" onClick={() => setStep(1)}>{t('ob.continue')}</button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-step">
          <h1>{t('ob.usage')}</h1>
          <div className="usage-grid">
            {USAGES.map((u) => (
              <button key={u.id} className={`usage ${usage === u.id ? 'on' : ''}`} onClick={() => setState({ usage: u.id })}>
                <span className="usage-icon" aria-hidden>{u.icon}</span>
                <strong>{t(`ob.usage.${u.id}` as any)}</strong>
                <span className="dim">{t(`ob.usage.${u.id}.d` as any)}</span>
                {usage === u.id && <span className="usage-check"><Icon name="check" size={14} /></span>}
              </button>
            ))}
          </div>
          <button className="btn primary big" onClick={() => setStep(2)}>{t('ob.continue')}</button>
        </div>
      )}

      {step === 2 && (
        <div className="ob-step">
          <h1>{t('ob.brand')}</h1>
          <p className="dim">{t('ob.brandSub')}</p>
          <label className="logo-drop">
            {logo ? <img src={logo} alt="" /> : <Icon name="plus" size={30} />}
            <span>{logo ? t('ob.changeLogo') : t('ob.addLogo')}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          <p className="label">{t('ob.colors')}</p>
          <div className="brand-colors">
            {[0, 1, 2].map((i) => (
              <label key={i} className="color-well" style={{ background: brand.colors[i] || 'transparent' }}>
                {!brand.colors[i] && <Icon name="plus" size={18} />}
                <input type="color" value={brand.colors[i] || '#C9A227'} onChange={(e) => setColor(i, e.target.value)} />
              </label>
            ))}
          </div>
          <div className="swatches">
            {SWATCHES.map((c) => (
              <button key={c} className="swatch" style={{ background: c }} aria-label={c}
                onClick={() => setColor(Math.min(brand.colors.length, 2), c)} />
            ))}
          </div>
          <button className="btn primary big" onClick={finish}>{t('ob.start')}</button>
          <button className="btn ghost" onClick={finish}>{t('ob.skip')}</button>
        </div>
      )}
    </div>
  );
}
