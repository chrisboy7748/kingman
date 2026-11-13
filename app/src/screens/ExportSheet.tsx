import { useEffect, useRef, useState } from 'react';
import { applyContent } from '../engine/apply';
import { browserRenderers } from '../engine/render';
import type { TemplateContent, TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { assetScale, canExport4k, exportSize, exportVideo, type ExportResult, type Quality } from '../media/export';
import { track } from '../services/analytics';
import { loadTemplate } from '../services/catalog';
import { isPro, useAppState } from '../services/store';
import { Icon, ProBadge, Sheet, requirePro } from '../ui/common';

export function ExportSheet({ m, content, audio, title, onClose, onExported }: {
  m: TemplateManifest;
  content: TemplateContent;
  audio: () => Promise<AudioBuffer | null>;
  title: string;
  onClose: () => void;
  onExported: () => void;
}) {
  const { t } = useT();
  const pro = useAppState((s) => isPro(s));
  const [quality, setQuality] = useState<Quality>(pro ? '1080p' : '720p');
  const [noWatermark, setNoWatermark] = useState(pro);
  const [can4k, setCan4k] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    canExport4k(m).then(setCan4k).catch(() => setCan4k(false));
  }, [m]);
  useEffect(() => {
    if (pro) setNoWatermark(true);
  }, [pro]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const pickQuality = async (q: Quality) => {
    if (q !== '720p' && !(await requirePro('quality'))) return;
    setQuality(q);
  };
  const toggleWatermark = async () => {
    if (!noWatermark && !(await requirePro('watermark'))) return;
    setNoWatermark(!noWatermark);
  };

  const run = async () => {
    // paywall moments: export without watermark / in high quality
    if ((noWatermark || quality !== '720p') && !isPro()) {
      const ok = await requirePro(noWatermark ? 'watermark' : 'quality');
      if (!ok) return;
    }
    setError(null);
    setResult(null);
    setProgress(0);
    abort.current = new AbortController();
    track('export_start', { id: m.id, quality, watermark: !noWatermark });
    try {
      const tpl = await loadTemplate(m);
      const animation = await applyContent(tpl, m, content, browserRenderers, { scale: assetScale(m, quality) });
      const res = await exportVideo({
        manifest: m,
        animation,
        quality,
        watermark: !(noWatermark && isPro()),
        audio: await audio(),
        onProgress: setProgress,
        signal: abort.current.signal,
      });
      setResult(res);
      setVideoUrl(URL.createObjectURL(res.blob));
      track('export_done', { id: m.id, quality, ms: Math.round(res.ms) });
      onExported();
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        setError(String(e?.message || e));
      }
    } finally {
      setProgress(null);
    }
  };

  const fileName = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'video'}.${result?.ext || 'mp4'}`;
  const file = () => new File([result!.blob], fileName, { type: result!.mime });
  const canShareFiles = !!result && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file()] });

  const share = async () => {
    if (!result) return;
    try {
      await navigator.share({ files: [file()], title });
      track('share', { id: m.id });
    } catch {
      /* cancelled */
    }
  };
  const save = () => {
    if (!result || !videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = fileName;
    a.click();
    track('save', { id: m.id });
  };

  const sizes = (q: Quality) => {
    const s = exportSize(m, q);
    return `${s.width}×${s.height}`;
  };

  return (
    <Sheet open onClose={() => { abort.current?.abort(); onClose(); }} title={t('x.title')}>
      {result && videoUrl ? (
        <div className="export-done">
          <video src={videoUrl} controls playsInline autoPlay loop muted={false} style={{ aspectRatio: String(m.width / m.height) }} />
          <p className="center"><strong>{t('x.ready')}</strong> <span className="dim">{t('x.took')} {(result.ms / 1000).toFixed(1)} s · {result.width}×{result.height} · {(result.blob.size / 1e6).toFixed(1)} MB</span></p>
          {canShareFiles && (
            <button className="btn primary big" onClick={share}><Icon name="share" /> {t('x.share')} <span className="dim small">· {t('x.shareHint')}</span></button>
          )}
          <button className={`btn big ${canShareFiles ? '' : 'primary'}`} onClick={save}><Icon name="download" /> {t('x.save')}</button>
          <button className="btn ghost" onClick={() => setResult(null)}>{t('x.again')}</button>
        </div>
      ) : progress !== null ? (
        <div className="export-progress">
          <div className="ring" style={{ ['--p' as any]: `${Math.round(progress * 100)}%` }}><span>{Math.round(progress * 100)}%</span></div>
          <p>{t('x.rendering')}</p>
          <button className="btn ghost" onClick={() => abort.current?.abort()}>{t('x.cancel')}</button>
        </div>
      ) : (
        <div className="export-form">
          <p className="label">{t('x.quality')}</p>
          <div className="qualities">
            {(['720p', '1080p', '4k'] as Quality[]).map((q) => {
              const disabled = q === '4k' && can4k === false;
              return (
                <button key={q} className={`quality ${quality === q ? 'on' : ''}`} disabled={disabled} onClick={() => pickQuality(q)}>
                  <strong>{q === '4k' ? '4K' : q}</strong>
                  <span className="dim small">{disabled ? t('x.4kNA') : sizes(q)}</span>
                  {q !== '720p' && !pro && <ProBadge small />}
                </button>
              );
            })}
          </div>
          <button className={`toggle ${noWatermark ? 'on' : ''}`} onClick={toggleWatermark} role="switch" aria-checked={noWatermark}>
            <span>{t('x.watermark')} {!pro && <ProBadge small />}</span>
            <span className="switch"><span /></span>
          </button>
          {error && <p className="error">{t('x.error')}: {error}</p>}
          <button className="btn primary big" onClick={run}><Icon name="download" /> {t('x.start')}</button>
        </div>
      )}
    </Sheet>
  );
}
