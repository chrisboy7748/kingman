import { FONTS, type FontFamily } from '../engine/types';
import { useT } from '../i18n';
import { putBlob } from '../services/db';
import { isPro, setState, useAppState } from '../services/store';
import { Icon, ProBadge, requirePro } from '../ui/common';
import { useBrandLogo } from '../ui/TemplateCard';

/** Kit de marque (Pro): logo, colors and font, saved once, applied to every template. */
export function BrandKit() {
  const { t, lang } = useT();
  const brand = useAppState((s) => s.brand);
  const pro = useAppState((s) => isPro(s));
  const logo = useBrandLogo();

  const onLogo = async (f: File | undefined) => {
    if (!f) return;
    const id = await putBlob(f);
    setState((s) => ({ brand: { ...s.brand, logoBlobId: id } }));
  };
  const setColor = (i: number, c: string | null) =>
    setState((s) => {
      const colors = [...s.brand.colors];
      if (c) colors[i] = c;
      else colors.splice(i, 1);
      return { brand: { ...s.brand, colors: colors.filter(Boolean).slice(0, 3) } };
    });
  const setFont = async (f: FontFamily) => {
    if (!(await requirePro('brand'))) return;
    setState((s) => ({ brand: { ...s.brand, font: f } }));
  };

  return (
    <div className="screen brandkit">
      <header className="topbar"><h1>{t('b.title')} {!pro && <ProBadge small />}</h1></header>
      <p className="dim pad">{t('b.sub')}</p>

      <section className="card">
        <h2>{t('b.logo')}</h2>
        <div className="logo-row">
          <label className="logo-drop small">
            {logo ? <img src={logo} alt="" /> : <Icon name="plus" size={26} />}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          <div>
            <p className="small dim">{t('b.logoHint')}</p>
            {logo && <button className="btn small ghost" onClick={() => setState((s) => ({ brand: { ...s.brand, logoBlobId: undefined } }))}>{t('b.removeLogo')}</button>}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>{t('b.colors')}</h2>
        <div className="brand-colors">
          {[0, 1, 2].map((i) => (
            <div key={i} className="color-edit">
              <label className="color-well" style={{ background: brand.colors[i] || 'transparent' }}>
                {!brand.colors[i] && <Icon name="plus" size={18} />}
                <input type="color" value={brand.colors[i] || '#C9A227'} onChange={(e) => setColor(Math.min(i, brand.colors.length), e.target.value)} />
              </label>
              {brand.colors[i] && <button className="link small" onClick={() => setColor(i, null)}>✕</button>}
              <span className="mono small dim">{brand.colors[i] || ''}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('b.font')}</h2>
        <div className="fonts">
          {FONTS.map((f) => (
            <button key={f} className={`font-chip big ${brand.font === f ? 'on' : ''}`} style={{ fontFamily: `"${f}"` }} onClick={() => setFont(f)}>
              {lang === 'ar' ? 'أبجد' : 'Aa'} <small>{f}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
