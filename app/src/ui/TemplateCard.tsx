import { useEffect, useMemo, useState } from 'react';
import { defaultContent } from '../engine/apply';
import type { Lang, TemplateContent, TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { sampleUrl } from '../services/catalog';
import { blobUrl } from '../services/db';
import { useAppState } from '../services/store';
import { ProBadge } from './common';
import { Player, useResolved } from './Player';

/** Default content + sample photos + the user's own logo (catalog previews feel personal). */
export function previewContent(m: TemplateManifest, lang: Lang, logo?: string): TemplateContent {
  const c = defaultContent(m, lang);
  for (const p of m.photos) if (p.sample) c.photos[p.key] = { src: sampleUrl(p.sample), crop: { x: 0, y: 0, zoom: 1 } };
  c.logo = logo;
  return c;
}

export function useBrandLogo() {
  const id = useAppState((s) => s.brand.logoBlobId);
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let alive = true;
    if (!id) setUrl(undefined);
    else blobUrl(id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}

export function TemplateCard({ m, onOpen, isNew, size = 'md' }: { m: TemplateManifest; onOpen: () => void; isNew?: boolean; size?: 'md' | 'lg' }) {
  const { lang, L, t } = useT();
  const logo = useBrandLogo();
  const content = useMemo(() => previewContent(m, lang, logo), [m, lang, logo]);
  // small asset scale for thumbnails: lighter on memory
  const { animation } = useResolved(m, content, 0.4);
  return (
    <button className={`tcard ${size}`} onClick={onOpen} aria-label={L(m.name)}>
      <Player animation={animation} aspect={m.width / m.height} autoPause poster={0.6} dpr={1} className="tcard-player">
        {!animation && <div className="shimmer" />}
      </Player>
      <div className="tcard-badges">
        {m.pro ? <ProBadge small /> : <span className="badge-free">{t('t.free')}</span>}
        {isNew && <span className="badge-new">{t('m.new')}</span>}
      </div>
      <div className="tcard-meta">
        <span className="tcard-name">{L(m.name)}</span>
        <span className="tcard-sub">{m.format} · {Math.round(m.duration)}{t('m.sec')}</span>
      </div>
    </button>
  );
}
