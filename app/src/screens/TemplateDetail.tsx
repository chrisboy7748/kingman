import { useEffect, useMemo, useState } from 'react';
import type { TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { audioPreview, renderTrack, trackById } from '../media/music';
import { back, navigate } from '../router';
import { track } from '../services/analytics';
import { newProject, saveProject } from '../services/projects';
import { useAppState } from '../services/store';
import { Icon, ProBadge, requirePro } from '../ui/common';
import { Player, useResolved } from '../ui/Player';
import { previewContent, useBrandLogo } from '../ui/TemplateCard';

/** Fiche template: full-screen preview with music, duration, what to provide, Pro badge, "Use". */
export function TemplateDetail({ m }: { m: TemplateManifest }) {
  const { t, L, lang } = useT();
  const logo = useBrandLogo();
  const content = useMemo(() => previewContent(m, lang, logo), [m, lang, logo]);
  const { animation } = useResolved(m, content, 1);
  const [sound, setSound] = useState(false);
  const music = trackById(m.music);
  const brand = useAppState((s) => s.brand);

  useEffect(() => {
    track('template_view', { id: m.id });
    return () => audioPreview.stop();
  }, [m.id]);

  const startSound = async () => {
    if (!music) return;
    audioPreview.unlock();
    setSound(true);
    const buf = await renderTrack(music.id);
    audioPreview.play(buf, 0, m.duration);
  };
  const toggleSound = () => {
    if (sound) {
      audioPreview.stop();
      setSound(false);
    } else startSound();
  };

  const use = async () => {
    if (m.pro && !(await requirePro('template'))) return;
    audioPreview.stop();
    const p = newProject(m, lang);
    if (brand.font) for (const k of Object.keys(p.texts)) p.texts[k] = { ...p.texts[k], family: brand.font };
    await saveProject(p);
    track('template_use', { id: m.id });
    navigate(`/edit/${p.id}`, true);
  };

  return (
    <div className="screen detail">
      <div className="detail-stage">
        <Player animation={animation} aspect={m.width / m.height} className="detail-player" onLoop={() => sound && music && renderTrack(music.id).then((b) => audioPreview.play(b, 0, m.duration))}>
          {!animation && <div className="shimmer" />}
        </Player>
        <button className="icon-btn floating start" onClick={() => back('/')} aria-label={t('m.back')}><Icon name="back" /></button>
        {music && (
          <button className="icon-btn floating end" onClick={toggleSound} aria-label={t('t.sound')}>
            <Icon name={sound ? 'sound' : 'mute'} />
          </button>
        )}
      </div>
      <div className="detail-panel">
        <div className="detail-title">
          <h1>{L(m.name)}</h1>
          {m.pro ? <ProBadge /> : <span className="badge-free">{t('t.free')}</span>}
        </div>
        <div className="facts">
          <div><span>{t('t.duration')}</span><strong>{Math.round(m.duration)} {t('m.sec')}</strong></div>
          <div><span>{t('t.format')}</span><strong>{m.format}</strong></div>
          <div><span>{t('t.texts')}</span><strong>{m.texts.length}</strong></div>
          <div><span>{t('t.photos')}</span><strong>{m.photos.length}</strong></div>
        </div>
        {music && <p className="music-line"><Icon name="music" size={16} /> {L(music.name)} · <span className="dim">{L(music.mood)}</span></p>}
        <button className="btn primary big" onClick={use}>
          {m.pro && <Icon name="crown" size={18} />} {t('t.use')}
        </button>
      </div>
    </div>
  );
}
