import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CROP, FONTS, type Crop, type FontFamily, type Lang, type TemplateContent, type TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { snapshot } from '../media/export';
import { audioPreview, decodeAudio, renderTrack, TRACKS, trackById } from '../media/music';
import { back, navigate } from '../router';
import { getBlob, putBlob } from '../services/db';
import { projectContent, saveProject, type MusicChoice, type Project } from '../services/projects';
import { isPro, useAppState } from '../services/store';
import { Icon, ProBadge, Toast, requirePro, useToast } from '../ui/common';
import { Player, useResolved } from '../ui/Player';
import { CropModal } from './CropModal';
import { ExportSheet } from './ExportSheet';

type Tab = 'texts' | 'photos' | 'colors' | 'music' | 'logo';

const BASE_COLORS = ['#FFFFFF', '#000000', '#1A1A1A', '#F5F0E8'];

export function Editor({ m, initial }: { m: TemplateManifest; initial: Project }) {
  const { t, L } = useT();
  const pro = useAppState((s) => isPro(s));
  const brand = useAppState((s) => s.brand);
  const logoId = brand.logoBlobId;
  const [p, setP] = useState<Project>(initial);
  const [content, setContent] = useState<TemplateContent | null>(null);
  const [tab, setTab] = useState<Tab>(m.texts.length ? 'texts' : 'photos');
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(false);
  const [cropKey, setCropKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, showToast] = useToast();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const musicInput = useRef<HTMLInputElement>(null);

  // project → engine content (photos as blob URLs)
  useEffect(() => {
    let alive = true;
    projectContent(p, m).then((c) => {
      if (!alive) return;
      setContent(c);
      const urls: Record<string, string> = {};
      for (const [k, v] of Object.entries(c.photos)) if (v) urls[k] = v.src;
      setPhotoUrls(urls);
    });
    return () => {
      alive = false;
    };
  }, [p, m, logoId]);

  const { animation, error } = useResolved(m, content, 1, 220);

  // autosave
  useEffect(() => {
    const timer = setTimeout(() => saveProject(p), 500);
    return () => clearTimeout(timer);
  }, [p]);

  // thumbnail for "My projects", refreshed shortly after each change
  useEffect(() => {
    if (!animation) return;
    let alive = true;
    const timer = setTimeout(() => {
      snapshot(animation, m, 240)
        .then((thumb) => alive && setP((cur) => (cur.thumb === thumb ? cur : { ...cur, thumb })))
        .catch((e) => console.warn('thumbnail', e));
    }, 1200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [animation, m]);

  // flush the last edit when leaving
  const latest = useRef(p);
  latest.current = p;
  useEffect(() => () => void saveProject(latest.current), []);

  // ---- music ----
  const musicBuffer = useCallback(async (): Promise<AudioBuffer | null> => {
    if (p.music.kind === 'none') return null;
    if (p.music.kind === 'library') return renderTrack(p.music.id);
    const blob = await getBlob(p.music.blobId);
    return blob ? decodeAudio(await blob.arrayBuffer()) : null;
  }, [p.music]);

  const restartAudio = useCallback(async (offsetFrames = 0) => {
    const buf = await musicBuffer();
    if (buf) audioPreview.play(buf, offsetFrames / m.fps, m.duration);
    else audioPreview.stop();
  }, [musicBuffer, m]);

  useEffect(() => () => audioPreview.stop(), []);
  useEffect(() => {
    if (sound && playing) restartAudio(0);
    else audioPreview.stop();
  }, [sound, playing, p.music, restartAudio]);

  const update = (fn: (d: Project) => void) =>
    setP((cur) => {
      const d = structuredClone(cur);
      fn(d);
      return d;
    });

  // ---- texts ----
  const setText = (key: string, patch: Partial<Project['texts'][string]>) => update((d) => (d.texts[key] = { ...d.texts[key], ...patch }));

  const switchLang = (lang: Lang) =>
    update((d) => {
      for (const s of m.texts) {
        const cur = d.texts[s.key]?.value;
        if (cur === undefined || cur === m.defaults[d.lang].texts[s.key]) d.texts[s.key] = { ...d.texts[s.key], value: m.defaults[lang].texts[s.key] ?? '' };
      }
      d.lang = lang;
    });

  // ---- photos ----
  const onPhoto = async (key: string, f: File | undefined) => {
    if (!f) return;
    const id = await putBlob(f);
    update((d) => (d.photos[key] = { blobId: id, crop: DEFAULT_CROP }));
    setCropKey(key);
  };

  // ---- colors ----
  const applyBrand = async () => {
    if (!brand.colors.length && !brand.font) {
      navigate('/brand');
      return;
    }
    if (!(await requirePro('brand'))) return;
    update((d) => {
      m.colors.forEach((c, i) => {
        if (brand.colors[i]) d.colors[c.key] = brand.colors[i];
      });
      if (brand.font) for (const s of m.texts) d.texts[s.key] = { ...d.texts[s.key], family: brand.font };
    });
    showToast('✓ ' + t('e.applyBrand'));
  };

  // ---- music ----
  const chooseTrack = async (id: string) => {
    const tr = trackById(id);
    if (tr?.pro && id !== m.music && !(await requirePro('music'))) return;
    update((d) => (d.music = { kind: 'library', id }));
    setSound(true);
  };
  const onOwnMusic = async (f: File | undefined) => {
    if (!f) return;
    const id = await putBlob(f);
    update((d) => (d.music = { kind: 'custom', blobId: id, name: f.name }));
    setSound(true);
  };
  const setMusic = (mc: MusicChoice) => update((d) => (d.music = mc));

  const palette = useMemo(() => {
    const set = new Set<string>([...m.colors.map((c) => c.default), ...Object.values(p.colors), ...brand.colors, ...BASE_COLORS].map((c) => c.toUpperCase()));
    return [...set];
  }, [m, p.colors, brand.colors]);

  const tabs: { id: Tab; icon: any; show: boolean; label: string }[] = [
    { id: 'texts', icon: 'text', show: m.texts.length > 0, label: t('e.texts') },
    { id: 'photos', icon: 'image', show: m.photos.length > 0, label: t('e.photos') },
    { id: 'colors', icon: 'palette', show: m.colors.length > 0, label: t('e.colors') },
    { id: 'music', icon: 'music', show: true, label: t('e.music') },
    { id: 'logo', icon: 'logo', show: m.hasLogo, label: t('e.logo') },
  ];

  const cropSlot = cropKey ? m.photos.find((s) => s.key === cropKey) : null;

  return (
    <div className="screen editor">
      <header className="topbar editor-bar">
        <button className="icon-btn ghost" onClick={() => back('/projects')} aria-label={t('m.back')}><Icon name="back" /></button>
        <input className="title-input" value={p.title} onChange={(e) => update((d) => (d.title = e.target.value))} aria-label="title" />
        <button className="btn primary" onClick={() => setExporting(true)} disabled={!animation}>{t('e.export')}</button>
      </header>

      <div className="editor-stage">
        <Player animation={animation} aspect={m.width / m.height} playing={playing} watermark={!pro} className="editor-player"
          onLoop={() => sound && playing && restartAudio(0)}>
          {!animation && <div className="shimmer" />}
        </Player>
        <div className="stage-ctrls">
          <button className="icon-btn" onClick={() => setPlaying(!playing)} aria-label="play"><Icon name={playing ? 'pause' : 'play'} size={18} /></button>
          <button className="icon-btn" onClick={() => { audioPreview.unlock(); setSound(!sound); }} aria-label={t('t.sound')}><Icon name={sound ? 'sound' : 'mute'} size={18} /></button>
          <div className="seg small">
            <button className={p.lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>EN</button>
            <button className={p.lang === 'ar' ? 'on' : ''} onClick={() => switchLang('ar')}>ع</button>
          </div>
        </div>
        {error && <p className="error small">{error}</p>}
      </div>

      <nav className="editor-tabs" role="tablist">
        {tabs.filter((x) => x.show).map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>
            <Icon name={x.icon} size={20} />
            <span>{x.label}</span>
          </button>
        ))}
      </nav>

      <div className="editor-panel">
        {tab === 'texts' && m.texts.map((s) => {
          const v = p.texts[s.key] || { value: '' };
          const family = v.family || s.style.family;
          const color = (v.color || s.style.color).toUpperCase();
          return (
            <div className="field" key={s.key}>
              <div className="field-head">
                <label htmlFor={`t-${s.key}`}>{L(s.label)}</label>
                <span className={`dim small ${v.value.length >= s.maxChars ? 'warn' : ''}`}>{v.value.length}/{s.maxChars}</span>
              </div>
              {s.maxLines > 1 ? (
                <textarea id={`t-${s.key}`} rows={Math.min(3, s.maxLines)} maxLength={s.maxChars} value={v.value} dir="auto"
                  onChange={(e) => setText(s.key, { value: e.target.value })} />
              ) : (
                <input id={`t-${s.key}`} maxLength={s.maxChars} value={v.value} dir="auto" onChange={(e) => setText(s.key, { value: e.target.value })} />
              )}
              <div className="fonts" aria-label={t('e.font')}>
                {FONTS.map((f) => (
                  <button key={f} className={`font-chip ${family === f ? 'on' : ''}`} style={{ fontFamily: `"${f}"` }} onClick={() => setText(s.key, { family: f as FontFamily })}>
                    {p.lang === 'ar' ? 'أبجد' : 'Aa'} <small>{f}</small>
                  </button>
                ))}
              </div>
              <div className="swatches" aria-label={t('e.color')}>
                {palette.map((c) => (
                  <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => setText(s.key, { color: c })} />
                ))}
                <label className="swatch custom" aria-label="custom"><input type="color" value={color.toLowerCase()} onChange={(e) => setText(s.key, { color: e.target.value })} /></label>
              </div>
            </div>
          );
        })}

        {tab === 'photos' && (
          <div className="photo-grid">
            {m.photos.map((s) => {
              const own = !!p.photos[s.key];
              return (
                <div className="photo-slot" key={s.key}>
                  <div className="photo-thumb" style={{ aspectRatio: String(s.w / s.h) }}>
                    {photoUrls[s.key] && <img src={photoUrls[s.key]} alt="" />}
                    {!own && <span className="sample-tag">sample</span>}
                  </div>
                  <span className="small">{L(s.label)}</span>
                  <div className="row-btns">
                    <button className="btn small" onClick={() => fileInputs.current[s.key]?.click()}><Icon name="image" size={16} /> {t('e.choosePhoto')}</button>
                    {own && <button className="btn small ghost" onClick={() => setCropKey(s.key)}>{t('e.crop')}</button>}
                  </div>
                  <input ref={(el) => (fileInputs.current[s.key] = el)} type="file" accept="image/*" hidden onChange={(e) => { onPhoto(s.key, e.target.files?.[0]); e.target.value = ''; }} />
                </div>
              );
            })}
          </div>
        )}

        {tab === 'colors' && (
          <>
            <button className="btn brand-btn" onClick={applyBrand}>
              <span className="brand-dots">{(brand.colors.length ? brand.colors : ['#888', '#aaa', '#ccc']).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              {t('e.applyBrand')} {!pro && <ProBadge small />}
            </button>
            {m.colors.map((c) => {
              const cur = (p.colors[c.key] || c.default).toUpperCase();
              return (
                <div className="field" key={c.key}>
                  <div className="field-head"><label>{L(c.label)}</label><span className="dim small mono">{cur}</span></div>
                  <div className="swatches">
                    {palette.map((x) => (
                      <button key={x} className={`swatch ${cur === x ? 'on' : ''}`} style={{ background: x }} aria-label={x} onClick={() => update((d) => (d.colors[c.key] = x))} />
                    ))}
                    <label className="swatch custom" aria-label="custom"><input type="color" value={cur.toLowerCase()} onChange={(e) => update((d) => (d.colors[c.key] = e.target.value))} /></label>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'music' && (
          <div className="tracks">
            <button className={`track ${p.music.kind === 'none' ? 'on' : ''}`} onClick={() => setMusic({ kind: 'none' })}>
              <span className="track-icon"><Icon name="mute" size={18} /></span><span className="track-name">{t('e.noMusic')}</span>
            </button>
            {TRACKS.map((tr) => {
              const on = p.music.kind === 'library' && p.music.id === tr.id;
              const locked = tr.pro && !pro && tr.id !== m.music;
              return (
                <button key={tr.id} className={`track ${on ? 'on' : ''}`} onClick={() => chooseTrack(tr.id)}>
                  <span className="track-icon"><Icon name="music" size={18} /></span>
                  <span className="track-name">{L(tr.name)}<small className="dim">{L(tr.mood)} · {tr.bpm} BPM</small></span>
                  {locked && <ProBadge small />}
                  {on && <Icon name="check" size={18} />}
                </button>
              );
            })}
            <button className={`track ${p.music.kind === 'custom' ? 'on' : ''}`} onClick={() => musicInput.current?.click()}>
              <span className="track-icon"><Icon name="plus" size={18} /></span>
              <span className="track-name">{t('e.myMusic')}{p.music.kind === 'custom' && <small className="dim">{p.music.name}</small>}</span>
            </button>
            <input ref={musicInput} type="file" accept="audio/*" hidden onChange={(e) => { onOwnMusic(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        )}

        {tab === 'logo' && (
          <div className="logo-info">
            <p>{logoId ? t('e.logoAuto') : t('e.logoMissing')}</p>
            <button className="btn" onClick={() => navigate('/brand')}><Icon name="brand" size={18} /> {t('nav.brand')}</button>
          </div>
        )}
      </div>

      {cropSlot && photoUrls[cropSlot.key] && p.photos[cropSlot.key] && (
        <CropModal
          src={photoUrls[cropSlot.key]}
          aspect={cropSlot.w / cropSlot.h}
          crop={p.photos[cropSlot.key]?.crop || DEFAULT_CROP}
          onClose={() => setCropKey(null)}
          onReplace={() => { setCropKey(null); fileInputs.current[cropSlot.key]?.click(); }}
          onDone={(c: Crop) => { update((d) => (d.photos[cropSlot.key] = { ...d.photos[cropSlot.key]!, crop: c })); setCropKey(null); }}
        />
      )}
      {exporting && content && (
        <ExportSheet m={m} content={content} audio={musicBuffer} title={p.title}
          onClose={() => setExporting(false)}
          onExported={() => update((d) => (d.exports = (d.exports || 0) + 1))} />
      )}
      <Toast text={toast} />
    </div>
  );
}
