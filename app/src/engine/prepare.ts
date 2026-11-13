/**
 * "Petit outil interne" — reads a Bodymovin export, finds the editable layers
 * (#txt_*, #img_*, #col_*), and produces:
 *   - a prepared Lottie JSON where every #txt_ text layer became an image layer
 *     (the app draws the text itself → correct Arabic shaping & right-to-left,
 *      this is plan B of the spec, applied by default),
 *   - the list of slots (texts, photos, colors, logo) used to build the template sheet,
 *   - a report with warnings about AE features Lottie cannot play.
 */
import {
  FONTS,
  type CategoryId,
  type ColorSlot,
  type Format,
  type FontFamily,
  type Justify,
  type LottieAnimation,
  type LottieLayer,
  type PhotoSlot,
  type PrepareReport,
  type TemplateManifest,
  type TextSlot,
  type Usage,
} from './types';
import { allLayerLists, firstValue, forEachPaint, parseTag, remapLayerSpace, rgbaToHex, scanUnsupported } from './lottieUtils';

export const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export interface PreparedTemplate {
  lottie: LottieAnimation;
  texts: TextSlot[];
  photos: PhotoSlot[];
  colors: ColorSlot[];
  hasLogo: boolean;
  /** placeholder images that were embedded in the AE export (key → data URL), usable as catalog samples */
  embeddedSamples: Record<string, string>;
  /** default texts found in the AE file (key → text) */
  aeTexts: Record<string, string>;
  report: PrepareReport;
}

const KNOWN_LABELS: Record<string, { en: string; ar: string }> = {
  title: { en: 'Title', ar: 'العنوان الرئيسي' },
  titre: { en: 'Title', ar: 'العنوان الرئيسي' },
  subtitle: { en: 'Subtitle', ar: 'العنوان الفرعي' },
  sous_titre: { en: 'Subtitle', ar: 'العنوان الفرعي' },
  price: { en: 'Price', ar: 'السعر' },
  prix: { en: 'Price', ar: 'السعر' },
  address: { en: 'Address', ar: 'الموقع' },
  adresse: { en: 'Address', ar: 'الموقع' },
  location: { en: 'Location', ar: 'الموقع' },
  features: { en: 'Features', ar: 'المميزات' },
  details: { en: 'Details', ar: 'التفاصيل' },
  cta: { en: 'Call to action', ar: 'دعوة لاتخاذ إجراء' },
  contact: { en: 'Contact', ar: 'التواصل' },
  phone: { en: 'Phone', ar: 'الهاتف' },
  date: { en: 'Date', ar: 'التاريخ' },
  name: { en: 'Name', ar: 'الاسم' },
  nom: { en: 'Name', ar: 'الاسم' },
  discount: { en: 'Discount', ar: 'الخصم' },
  remise: { en: 'Discount', ar: 'الخصم' },
  quote: { en: 'Quote', ar: 'الاقتباس' },
  author: { en: 'Author', ar: 'الكاتب' },
  brand: { en: 'Brand name', ar: 'اسم العلامة' },
  hours: { en: 'Opening hours', ar: 'ساعات العمل' },
  primary: { en: 'Main color', ar: 'اللون الرئيسي' },
  principale: { en: 'Main color', ar: 'اللون الرئيسي' },
  secondary: { en: 'Second color', ar: 'اللون الثانوي' },
  secondaire: { en: 'Second color', ar: 'اللون الثانوي' },
  accent: { en: 'Accent', ar: 'لون مميز' },
  background: { en: 'Background', ar: 'الخلفية' },
  fond: { en: 'Background', ar: 'الخلفية' },
};

export function labelFor(key: string): { en: string; ar: string } {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  const m = /^(photo|image|img|item|line|ligne|feature)_?(\d+)$/.exec(key);
  if (m) {
    const n = m[2];
    if (m[1] === 'photo' || m[1] === 'image' || m[1] === 'img') return { en: `Photo ${n}`, ar: `صورة ${n}` };
    return { en: `Line ${n}`, ar: `سطر ${n}` };
  }
  const human = key.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return { en: human, ar: human };
}

const WEIGHTS: [RegExp, number][] = [
  [/thin|hairline/i, 100],
  [/extra\s*light|ultra\s*light/i, 200],
  [/light/i, 300],
  [/semi\s*bold|demi/i, 600],
  [/extra\s*bold|ultra\s*bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700],
  [/medium/i, 500],
];

export function weightFromStyle(style: string | undefined): number {
  for (const [re, w] of WEIGHTS) if (style && re.test(style)) return w;
  return 400;
}

export function matchFont(family: string | undefined): FontFamily {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const f = norm(family || '');
  return (FONTS.find((x) => f.startsWith(norm(x))) as FontFamily) || 'Cairo';
}

export function detectFormat(w: number, h: number): Format {
  const r = w / h;
  const candidates: [Format, number][] = [
    ['9:16', 9 / 16],
    ['4:5', 4 / 5],
    ['1:1', 1],
    ['16:9', 16 / 9],
  ];
  candidates.sort((a, b) => Math.abs(a[1] - r) - Math.abs(b[1] - r));
  return candidates[0][0];
}

const JUSTIFY: Record<number, Justify> = { 0: 'left', 1: 'right', 2: 'center' };

function convertTextLayer(
  layer: LottieLayer,
  key: string,
  anim: LottieAnimation,
): { slot: Omit<TextSlot, 'assetId' | 'key'>; text: string } {
  const doc = layer.t?.d?.k?.[0]?.s || {};
  const fontInfo = (anim.fonts?.list || []).find((f: any) => f.fName === doc.f) || {};
  const family = matchFont(fontInfo.fFamily || doc.f);
  const weight = weightFromStyle(fontInfo.fStyle || doc.f);
  const size: number = doc.s || 60;
  const lh: number = doc.lh || size * 1.2;
  const text: string = String(doc.t ?? '').replace(/\r/g, '\n');
  const justify = JUSTIFY[doc.j ?? 0] || 'left';
  const lines = Math.max(1, text.split('\n').length);

  let w: number;
  let h: number;
  let ps: [number, number];
  if (Array.isArray(doc.sz) && Array.isArray(doc.ps)) {
    // paragraph (box) text — the best practice
    w = doc.sz[0];
    h = doc.sz[1];
    ps = [doc.ps[0], doc.ps[1]];
  } else {
    // point text: estimate a box around the baseline origin
    const longest = Math.max(...text.split('\n').map((l) => l.length), 4);
    w = Math.max(longest * size * 0.62, size * 3) * 1.15;
    h = lh * lines + size * 0.35;
    const x = justify === 'center' ? -w / 2 : justify === 'right' ? -w : 0;
    ps = [x, -size * 0.9];
  }
  w = Math.max(8, Math.round(w));
  h = Math.max(8, Math.round(h));
  const maxLines = Math.max(1, Math.floor((h + 1) / lh));
  const perLine = Math.max(3, Math.floor(w / (size * 0.52)));
  const maxChars = Math.min(240, Math.max(4, perLine * maxLines));

  remapLayerSpace(layer, 1, ps);
  delete layer.t;
  layer.ty = 2;

  return {
    text,
    slot: {
      label: labelFor(key),
      w,
      h,
      maxChars,
      maxLines,
      style: {
        family,
        weight,
        size,
        color: rgbaToHex(doc.fc || [1, 1, 1]),
        justify,
        valign: 'top',
        lineHeight: +(lh / size).toFixed(3),
        tracking: doc.tr || 0,
        caps: doc.ca === 1,
      },
    },
  };
}

export function prepareTemplate(input: LottieAnimation): PreparedTemplate {
  const anim: LottieAnimation = JSON.parse(JSON.stringify(input));
  anim.assets = anim.assets || [];
  const texts: TextSlot[] = [];
  const photos: PhotoSlot[] = [];
  const colorMap = new Map<string, ColorSlot>();
  const embeddedSamples: Record<string, string> = {};
  const aeTexts: Record<string, string> = {};
  const extraWarnings: string[] = [];
  const slotAssetIds = new Set<string>();
  let hasLogo = false;

  // Scan before converting (text animators etc. disappear with the conversion)
  const warnings = scanUnsupported(anim, new Set(
    anim.layers.concat(...anim.assets.filter((a) => a.layers).map((a) => a.layers!))
      .filter((l) => l.ty === 2 && parseTag(l.nm)?.kind === 'img')
      .map((l) => l.refId!),
  ));

  for (const list of allLayerLists(anim)) {
    for (const layer of list) {
      const tag = parseTag(layer.nm);
      if (!tag) continue;

      if (tag.kind === 'txt') {
        if (layer.ty !== 5) {
          extraWarnings.push(`« ${layer.nm} » : #txt_ doit être un calque de texte.`);
          continue;
        }
        const { slot, text } = convertTextLayer(layer, tag.key, anim);
        // Same key twice → same text. Reuse the asset if the box is the same size.
        let key = tag.key;
        const existing = texts.find((t) => t.key === key);
        if (existing && (existing.w !== slot.w || existing.h !== slot.h)) {
          let n = 2;
          while (texts.some((t) => t.key === `${tag.key}_${n}`)) n++;
          key = `${tag.key}_${n}`;
          extraWarnings.push(`« ${layer.nm} » : clé déjà utilisée avec une autre taille de boîte, renommée « ${key} ».`);
        }
        const assetId = `txt_${key}`;
        layer.refId = assetId;
        layer.nm = `#txt_${key}`;
        if (!texts.find((t) => t.key === key)) {
          texts.push({ key, assetId, ...slot });
          anim.assets.push({ id: assetId, w: slot.w, h: slot.h, u: '', p: TRANSPARENT_PNG, e: 1 });
          aeTexts[key] = text;
        }
        slotAssetIds.add(assetId);
      } else if (tag.kind === 'img') {
        if (layer.ty !== 2) {
          extraWarnings.push(`« ${layer.nm} » : #img_ doit être un calque image (pas un solide ni une précomposition).`);
          continue;
        }
        const asset = anim.assets.find((a) => a.id === layer.refId);
        if (!asset || !asset.w || !asset.h) {
          extraWarnings.push(`« ${layer.nm} » : image introuvable dans l'export.`);
          continue;
        }
        if (!slotAssetIds.has(asset.id)) {
          if (typeof asset.p === 'string' && asset.p.startsWith('data:image')) embeddedSamples[tag.key] = asset.p;
          asset.u = '';
          asset.p = TRANSPARENT_PNG;
          asset.e = 1;
          slotAssetIds.add(asset.id);
        }
        if (tag.key === 'logo') {
          hasLogo = true;
          (anim as any).meta = { ...(anim as any).meta, logoAsset: asset.id };
          continue;
        }
        if (!photos.find((p) => p.key === tag.key)) {
          photos.push({ key: tag.key, label: labelFor(tag.key), assetId: asset.id, w: asset.w, h: asset.h });
        }
      } else if (tag.kind === 'col') {
        let color: string | undefined;
        if (layer.ty === 1 && layer.sc) color = layer.sc;
        if (layer.ty === 4) {
          forEachPaint(layer.shapes, (p) => {
            if (!color) color = rgbaToHex(firstValue(p.c) || [0, 0, 0]);
          });
        }
        if (!color) {
          extraWarnings.push(`« ${layer.nm} » : aucun remplissage/contour trouvé pour la couleur.`);
          continue;
        }
        if (!colorMap.has(tag.key)) colorMap.set(tag.key, { key: tag.key, label: labelFor(tag.key), default: color });
      }
    }
  }

  // No text layer left → no font to load
  const stillHasText = allLayerLists(anim).some((list) => list.some((l) => l.ty === 5));
  if (!stillHasText) {
    anim.fonts = { list: [] };
    delete anim.chars;
  }

  if (texts.length === 0) extraWarnings.push('Aucun calque #txt_ : le template n\'a pas de texte modifiable.');
  if (texts.length > 5) extraWarnings.push(`${texts.length} textes : la règle est 1 à 5 textes par template.`);
  if (photos.length > 5) extraWarnings.push(`${photos.length} photos : la règle est 0 à 5 photos par template.`);

  const duration = (anim.op - anim.ip) / anim.fr;
  if (duration < 6 || duration > 15) extraWarnings.push(`Durée ${duration.toFixed(1)} s : la règle est 6 à 15 secondes.`);

  // Editor order = reading order: texts from top to bottom, photos by name (photo1, photo2…)
  const textOrder = new Map<string, [number, number]>(); // key → [y, first frame]
  for (const list of allLayerLists(anim))
    for (const l of list) {
      const tag = parseTag(l.nm);
      if (tag?.kind !== 'txt' || textOrder.has(tag.key)) continue;
      let y = 0;
      for (let cur: LottieLayer | undefined = l; cur; cur = list.find((x) => x.ind === cur!.parent)) {
        const p = firstValue(cur.ks?.p);
        if (Array.isArray(p)) y += p[1];
        if (!cur.parent) break;
      }
      textOrder.set(tag.key, [y, l.ip]);
    }
  const ord = (k: string) => textOrder.get(k) ?? [0, 0];
  texts.sort((a, b) => ord(a.key)[0] - ord(b.key)[0] || ord(a.key)[1] - ord(b.key)[1] || a.key.localeCompare(b.key, 'en', { numeric: true }));
  photos.sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));

  // Order colors: main first, then secondary, then the rest
  const order = ['primary', 'principale', 'secondary', 'secondaire', 'accent'];
  const colors = [...colorMap.values()].sort((a, b) => {
    const ia = order.indexOf(a.key) < 0 ? 99 : order.indexOf(a.key);
    const ib = order.indexOf(b.key) < 0 ? 99 : order.indexOf(b.key);
    return ia - ib;
  });

  return {
    lottie: anim,
    texts,
    photos,
    colors,
    hasLogo,
    embeddedSamples,
    aeTexts,
    report: {
      texts: texts.length,
      photos: photos.length,
      colors: colors.length,
      duration,
      format: detectFormat(anim.w, anim.h),
      warnings: [...warnings, ...extraWarnings],
    },
  };
}

export interface ManifestMeta {
  id: string;
  name: { en: string; ar: string };
  category: CategoryId;
  usages: Usage[];
  tags?: string[];
  pro: boolean;
  publishedAt?: string;
  trending?: number;
  music?: string | null;
  defaults: { en: Record<string, string>; ar: Record<string, string> };
  samples?: Record<string, string>;
  version?: number;
}

export function buildManifest(p: PreparedTemplate, meta: ManifestMeta): TemplateManifest {
  const fr = p.lottie.fr;
  return {
    id: meta.id,
    version: meta.version ?? 1,
    name: meta.name,
    category: meta.category,
    usages: meta.usages,
    tags: meta.tags ?? [],
    pro: meta.pro,
    publishedAt: meta.publishedAt ?? new Date().toISOString().slice(0, 10),
    trending: meta.trending ?? 0,
    format: p.report.format,
    width: p.lottie.w,
    height: p.lottie.h,
    fps: fr,
    frames: Math.round(p.lottie.op - p.lottie.ip),
    duration: +p.report.duration.toFixed(2),
    texts: p.texts,
    photos: p.photos.map((ph) => ({ ...ph, sample: meta.samples?.[ph.key] })),
    colors: p.colors,
    hasLogo: p.hasLogo,
    defaults: {
      en: { texts: { ...p.aeTexts, ...meta.defaults.en } },
      ar: { texts: { ...p.aeTexts, ...meta.defaults.ar } },
    },
    music: meta.music ?? null,
    file: `templates/${meta.id}.json`,
  };
}
