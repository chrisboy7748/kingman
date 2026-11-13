import { useEffect, useRef, useState } from 'react';
import type { Crop } from '../engine/types';
import { useT } from '../i18n';
import { Sheet } from '../ui/common';

/** "On recadre avec le doigt": drag to pan, pinch (or slider) to zoom. */
export function CropModal({ src, aspect, crop, onDone, onClose, onReplace }: {
  src: string;
  aspect: number;
  crop: Crop;
  onDone: (c: Crop) => void;
  onClose: () => void;
  onReplace: () => void;
}) {
  const { t } = useT();
  const frame = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const [c, setC] = useState<Crop>(crop);
  const [box, setBox] = useState({ w: 300, h: 300 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = src;
  }, [src]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = (cr: Crop) => {
    if (!img) return null;
    const cover = Math.max(box.w / img.w, box.h / img.h) * cr.zoom;
    const dw = img.w * cover;
    const dh = img.h * cover;
    const ox = dw - box.w;
    const oy = dh - box.h;
    return { dw, dh, ox, oy, left: (-ox / 2) * (1 + cr.x), top: (-oy / 2) * (1 + cr.y) };
  };
  const g = geo(c);
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: c.zoom };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setC((cur) => ({ ...cur, zoom: Math.max(1, Math.min(4, (pinch.current!.zoom * d) / pinch.current!.dist)) }));
      return;
    }
    const geom = geo(c);
    if (!geom) return;
    // In RTL documents clientX still grows to the right, so no mirroring needed.
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    setC((cur) => ({
      ...cur,
      x: geom.ox > 0 ? clamp(cur.x - (2 * dx) / geom.ox) : 0,
      y: geom.oy > 0 ? clamp(cur.y - (2 * dy) / geom.oy) : 0,
    }));
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent) => setC((cur) => ({ ...cur, zoom: Math.max(1, Math.min(4, cur.zoom * (e.deltaY < 0 ? 1.06 : 0.94))) }));

  return (
    <Sheet open onClose={onClose} title={t('c.title')}>
      <div className="crop">
        <div ref={frame} className="crop-frame" style={{ aspectRatio: String(aspect) }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
          {g && <img src={src} alt="" draggable={false} style={{ width: g.dw, height: g.dh, left: g.left, top: g.top }} />}
          <div className="crop-grid" />
        </div>
        <p className="dim small center">{t('c.hint')}</p>
        <input className="range" type="range" min={1} max={4} step={0.01} value={c.zoom} onChange={(e) => setC({ ...c, zoom: +e.target.value })} aria-label="zoom" />
        <div className="row-btns">
          <button className="btn" onClick={onReplace}>{t('c.replace')}</button>
          <button className="btn primary" onClick={() => onDone(c)}>{t('c.done')}</button>
        </div>
      </div>
    </Sheet>
  );
}
