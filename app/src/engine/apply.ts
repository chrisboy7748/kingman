/**
 * applyContent — the whole editor in one function: it takes a prepared template and
 * the user's content and returns a Lottie animation ready to play or export.
 * The animation (timing, easing, motion) is never modified: only image assets
 * (texts are rendered as images), colors of #col_ layers, and the logo visibility.
 */
import type { Crop, Lang, LottieAnimation, TemplateContent, TemplateManifest, TextSlot, TextStyle } from './types';
import { DEFAULT_CROP } from './types';
import { allLayerLists, forEachPaint, hexToRgba, isAnimated, parseTag, remapLayerSpace } from './lottieUtils';

export interface Renderers {
  /** Draws a text into a transparent image of size (slot.w*scale × slot.h*scale) and returns its URL. */
  text(slot: TextSlot, value: string, style: TextStyle, scale: number, lang: Lang): Promise<string>;
  /** Crops a photo into an image of size (w × h) and returns its URL. */
  photo(src: string, crop: Crop, w: number, h: number): Promise<string>;
  /** Fits a logo (contain) into an image of size (w × h) and returns its URL. */
  logo(src: string, w: number, h: number): Promise<string>;
}

export interface ApplyOptions {
  /**
   * Resolution factor for the replaceable images, relative to the composition size.
   * 1 = composition size (1080p for a 1080×1920 template), 2 = 4K, 0.4 = catalog thumbnails.
   */
  scale?: number;
}

export function resolveTextStyle(slot: TextSlot, content: TemplateContent): TextStyle {
  const t = content.texts[slot.key];
  return {
    ...slot.style,
    family: t?.family || slot.style.family,
    color: t?.color || slot.style.color,
  };
}

export function resolveTextValue(slot: TextSlot, manifest: TemplateManifest, content: TemplateContent): string {
  const t = content.texts[slot.key];
  if (t && typeof t.value === 'string') return t.value;
  return manifest.defaults[content.lang]?.texts[slot.key] ?? manifest.defaults.en.texts[slot.key] ?? '';
}

function setPaintColor(item: any, rgba: number[]) {
  if (!item.c) return;
  if (isAnimated(item.c)) {
    for (const kf of item.c.k) {
      if (kf.s) kf.s = rgba.slice(0, kf.s.length);
      if (kf.e) kf.e = rgba.slice(0, kf.e.length);
    }
  } else {
    item.c = { a: 0, k: rgba.slice(0, Array.isArray(item.c.k) ? item.c.k.length : 4) };
  }
}

export async function applyContent(
  template: LottieAnimation,
  manifest: TemplateManifest,
  content: TemplateContent,
  renderers: Renderers,
  opts: ApplyOptions = {},
): Promise<LottieAnimation> {
  const scale = opts.scale ?? 1;
  const anim: LottieAnimation =
    typeof structuredClone === 'function' ? structuredClone(template) : JSON.parse(JSON.stringify(template));
  const assets = new Map(anim.assets.map((a) => [a.id, a]));
  const logoAssetId: string | undefined = (anim as any).meta?.logoAsset;

  const jobs: Promise<void>[] = [];

  // texts
  for (const slot of manifest.texts) {
    const asset = assets.get(slot.assetId);
    if (!asset) continue;
    const value = resolveTextValue(slot, manifest, content);
    const style = resolveTextStyle(slot, content);
    jobs.push(
      renderers.text(slot, value, style, scale, content.lang).then((url) => {
        asset.p = url;
        asset.u = '';
        asset.e = 1;
        asset.w = Math.round(slot.w * scale);
        asset.h = Math.round(slot.h * scale);
      }),
    );
  }

  // photos
  for (const slot of manifest.photos) {
    const asset = assets.get(slot.assetId);
    if (!asset) continue;
    const ph = content.photos[slot.key];
    const src = ph?.src || slot.sample;
    const w = Math.round(slot.w * scale);
    const h = Math.round(slot.h * scale);
    if (!src) {
      asset.w = w;
      asset.h = h;
      continue;
    }
    jobs.push(
      renderers.photo(src, ph?.crop || DEFAULT_CROP, w, h).then((url) => {
        asset.p = url;
        asset.u = '';
        asset.e = 1;
        asset.w = w;
        asset.h = h;
      }),
    );
  }

  // logo
  if (logoAssetId) {
    const asset = assets.get(logoAssetId);
    if (asset && content.logo) {
      const w = Math.round((asset.w || 200) * scale);
      const h = Math.round((asset.h || 200) * scale);
      jobs.push(
        renderers.logo(content.logo, w, h).then((url) => {
          asset.p = url;
          asset.e = 1;
          asset.w = w;
          asset.h = h;
        }),
      );
    } else if (asset) {
      asset.w = Math.round((asset.w || 1) * scale);
      asset.h = Math.round((asset.h || 1) * scale);
    }
  }

  // colors + layer adjustments
  const slotAssets = new Set<string>([
    ...manifest.texts.map((t) => t.assetId),
    ...manifest.photos.map((p) => p.assetId),
    ...(logoAssetId ? [logoAssetId] : []),
  ]);
  for (const list of allLayerLists(anim)) {
    for (const layer of list) {
      if (layer.ty === 2 && layer.refId && slotAssets.has(layer.refId) && scale !== 1) {
        remapLayerSpace(layer, scale);
      }
      if (layer.ty === 2 && layer.refId === logoAssetId && !content.logo) layer.hd = true;
      const tag = parseTag(layer.nm);
      if (tag?.kind === 'col') {
        const hex = content.colors[tag.key] ?? manifest.colors.find((c) => c.key === tag.key)?.default;
        if (!hex) continue;
        const rgba = hexToRgba(hex);
        if (layer.ty === 1) layer.sc = hex;
        if (layer.ty === 4) forEachPaint(layer.shapes, (p) => setPaintColor(p, rgba));
      }
    }
  }

  await Promise.all(jobs);
  return anim;
}

/** Content with all defaults, for a given language (catalog previews, new projects). */
export function defaultContent(manifest: TemplateManifest, lang: Lang): TemplateContent {
  const texts: TemplateContent['texts'] = {};
  for (const t of manifest.texts) {
    texts[t.key] = { value: manifest.defaults[lang]?.texts[t.key] ?? manifest.defaults.en.texts[t.key] ?? '' };
  }
  const colors: Record<string, string> = {};
  for (const c of manifest.colors) colors[c.key] = c.default;
  return { lang, texts, photos: {}, colors };
}
