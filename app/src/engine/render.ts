/**
 * Browser renderers for applyContent(): texts, photos and logo are drawn with canvas 2D.
 * Canvas text uses the browser's text shaping, so Arabic letters are joined correctly
 * and right-to-left lines are laid out properly — something Lottie's own text
 * rendering does letter by letter (and gets wrong for Arabic).
 */
import type { Renderers } from './apply';
import type { Crop, Lang, TextSlot, TextStyle } from './types';

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
export const isArabic = (s: string) => ARABIC.test(s);

// ---- small LRU of object URLs ---------------------------------------------

class UrlCache {
  private map = new Map<string, Promise<string>>();
  constructor(private max: number) {}
  get(key: string, make: () => Promise<string>): Promise<string> {
    const hit = this.map.get(key);
    if (hit) {
      this.map.delete(key);
      this.map.set(key, hit);
      return hit;
    }
    const p = make();
    this.map.set(key, p);
    p.catch(() => this.map.delete(key));
    while (this.map.size > this.max) {
      const [oldKey, old] = this.map.entries().next().value as [string, Promise<string>];
      this.map.delete(oldKey);
      // Images already decoded by lottie keep working after revocation.
      old.then((u) => setTimeout(() => URL.revokeObjectURL(u), 30_000)).catch(() => {});
    }
    return p;
  }
}

const cache = new UrlCache(160);

function canvasToUrl(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        canvas.width = 0;
        canvas.height = 0;
        if (!b) return reject(new Error('toBlob failed'));
        resolve(URL.createObjectURL(b));
      },
      type,
      quality,
    );
  });
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// ---- fonts -----------------------------------------------------------------

const fontSpec = (style: Pick<TextStyle, 'weight' | 'family'>, px: number) =>
  `${style.weight} ${Math.max(1, px).toFixed(2)}px "${style.family}"`;

export async function ensureFont(style: Pick<TextStyle, 'weight' | 'family'>, text: string) {
  if (!('fonts' in document)) return;
  try {
    await document.fonts.load(fontSpec(style, 40), text || 'Aa');
  } catch {
    /* ignore — falls back to system font */
  }
}

// ---- text layout -------------------------------------------------------------

export interface TextLayout {
  lines: string[];
  px: number;
  lineHeight: number;
  rtl: boolean;
  fits: boolean;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width <= maxW) line = test;
      else {
        out.push(line);
        line = words[i];
      }
    }
    out.push(line);
  }
  return out;
}

/** Shrinks the font until the text fits the box: nothing ever overflows. */
export function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  W: number,
  H: number,
  scale: number,
): TextLayout {
  const rtl = isArabic(text);
  let px = style.size * scale;
  const minPx = px * 0.3;
  let lines: string[] = [];
  let fits = false;
  for (let i = 0; i < 40; i++) {
    ctx.font = fontSpec(style, px);
    setTracking(ctx, style, px, rtl);
    lines = wrap(ctx, text, W);
    const lh = px * style.lineHeight;
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    fits = lines.length * lh <= H * 1.04 + 0.5 && widest <= W + 0.5;
    if (fits || px <= minPx) break;
    px *= 0.93;
  }
  return { lines, px, lineHeight: px * style.lineHeight, rtl, fits };
}

function setTracking(ctx: CanvasRenderingContext2D, style: TextStyle, px: number, rtl: boolean) {
  const c = ctx as any;
  if ('letterSpacing' in c) c.letterSpacing = !rtl && style.tracking ? `${(style.tracking / 1000) * px}px` : '0px';
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  value: string,
  style: TextStyle,
  W: number,
  H: number,
  scale: number,
) {
  const text = style.caps ? value.toUpperCase() : value;
  const L = layoutText(ctx, text, style, W, H, scale);
  ctx.font = fontSpec(style, L.px);
  setTracking(ctx, style, L.px, L.rtl);
  ctx.fillStyle = style.color;
  ctx.direction = L.rtl ? 'rtl' : 'ltr';
  ctx.textBaseline = 'alphabetic';

  // Mirror the justification for Arabic: a left-aligned English layout becomes right-aligned.
  let justify = style.justify;
  if (L.rtl && justify === 'left') justify = 'right';
  else if (L.rtl && justify === 'right') justify = 'left';
  ctx.textAlign = justify;
  const x = justify === 'left' ? 0 : justify === 'right' ? W : W / 2;

  const m = ctx.measureText(L.rtl ? 'أهلاً' : 'Hg');
  const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? L.px * 0.8;
  const desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? L.px * 0.2;
  const total = L.lines.length * L.lineHeight;
  let y0 = 0;
  if (style.valign === 'center') y0 = (H - total) / 2;
  else if (style.valign === 'bottom') y0 = H - total;
  L.lines.forEach((line, i) => {
    const baseline = y0 + i * L.lineHeight + (L.lineHeight - (asc + desc)) / 2 + asc;
    ctx.fillText(line, x, baseline);
  });
  return L;
}

// ---- images ------------------------------------------------------------------

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`image failed: ${src.slice(0, 80)}`));
      img.src = src;
    });
    imageCache.set(src, p);
    p.catch(() => imageCache.delete(src));
    if (imageCache.size > 60) imageCache.delete(imageCache.keys().next().value as string);
  }
  return p;
}

/** Computes the source rectangle of a "cover" crop. */
export function cropRect(iw: number, ih: number, w: number, h: number, crop: Crop) {
  const zoom = Math.max(1, crop.zoom || 1);
  const cover = Math.max(w / iw, h / ih) * zoom;
  const sw = w / cover;
  const sh = h / cover;
  const sx = ((iw - sw) / 2) * (1 + Math.max(-1, Math.min(1, crop.x || 0)));
  const sy = ((ih - sh) / 2) * (1 + Math.max(-1, Math.min(1, crop.y || 0)));
  return { sx, sy, sw, sh };
}

export const browserRenderers: Renderers = {
  text(slot: TextSlot, value: string, style: TextStyle, scale: number, lang: Lang) {
    const key = JSON.stringify(['t', slot.w, slot.h, value, style, scale, lang]);
    return cache.get(key, async () => {
      await ensureFont(style, value);
      const W = slot.w * scale;
      const H = slot.h * scale;
      const c = makeCanvas(W, H);
      const ctx = c.getContext('2d')!;
      drawText(ctx, value, style, c.width, c.height, scale);
      return canvasToUrl(c, 'image/png');
    });
  },
  photo(src: string, crop: Crop, w: number, h: number) {
    const key = JSON.stringify(['p', src, crop, w, h]);
    return cache.get(key, async () => {
      const img = await loadImage(src);
      const c = makeCanvas(w, h);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      const r = cropRect(img.naturalWidth, img.naturalHeight, c.width, c.height, crop);
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
      return canvasToUrl(c, 'image/jpeg', 0.9);
    });
  },
  logo(src: string, w: number, h: number) {
    const key = JSON.stringify(['l', src, w, h]);
    return cache.get(key, async () => {
      const img = await loadImage(src);
      const c = makeCanvas(w, h);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      const s = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
      return canvasToUrl(c, 'image/png');
    });
  },
};
