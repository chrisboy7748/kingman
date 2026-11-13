/**
 * Template engine — shared types.
 *
 * Pipeline:
 *   After Effects  →  Bodymovin JSON (layers named #txt_*, #img_*, #col_*)
 *                  →  prepareTemplate()   (internal tool / back-office)
 *                  →  prepared Lottie JSON + TemplateManifest   (published to the catalog)
 *                  →  applyContent()      (in the app, every time the user edits)
 *                  →  Lottie JSON ready to play / export
 */

export type Lang = 'en' | 'ar';
export type Format = '9:16' | '1:1' | '4:5' | '16:9';
export type Usage = 'real-estate' | 'retail' | 'creator' | 'personal';
export type CategoryId = 'real-estate' | 'promos' | 'food' | 'beauty' | 'events' | 'quotes';

export type Justify = 'left' | 'right' | 'center';
export type VAlign = 'top' | 'center' | 'bottom';

/** Fonts the user can choose from (all support Latin + Arabic). */
export const FONTS = ['Cairo', 'Tajawal', 'El Messiri', 'Reem Kufi', 'Amiri'] as const;
export type FontFamily = (typeof FONTS)[number];

export interface TextStyle {
  family: FontFamily;
  weight: number;
  /** font size in composition pixels */
  size: number;
  /** '#rrggbb' */
  color: string;
  justify: Justify;
  valign: VAlign;
  /** line height as a multiple of the font size */
  lineHeight: number;
  /** tracking in 1/1000 em (AE units) — ignored for Arabic text, it would break letter joining */
  tracking: number;
  caps: boolean;
}

export interface TextSlot {
  key: string;
  label: { en: string; ar: string };
  /** id of the image asset that carries the rendered text */
  assetId: string;
  /** text box in composition pixels */
  w: number;
  h: number;
  maxChars: number;
  maxLines: number;
  style: TextStyle;
}

export interface PhotoSlot {
  key: string;
  label: { en: string; ar: string };
  assetId: string;
  w: number;
  h: number;
  /** sample photo used in the catalog preview (relative URL) */
  sample?: string;
}

export interface ColorSlot {
  key: string;
  label: { en: string; ar: string };
  default: string;
}

export interface LangDefaults {
  texts: Record<string, string>;
}

export interface TemplateManifest {
  id: string;
  version: number;
  name: { en: string; ar: string };
  category: CategoryId;
  usages: Usage[];
  tags: string[];
  pro: boolean;
  /** ISO date — the newest week of templates is shown in "New this week" */
  publishedAt: string;
  /** popularity score (in production: number of exports over the last 7 days) */
  trending: number;
  format: Format;
  width: number;
  height: number;
  fps: number;
  frames: number;
  /** seconds */
  duration: number;
  texts: TextSlot[];
  photos: PhotoSlot[];
  colors: ColorSlot[];
  /** true if the template has an #img_logo layer (filled from the brand kit) */
  hasLogo: boolean;
  defaults: Record<Lang, LangDefaults>;
  /** default music track id, or null */
  music: string | null;
  /** relative URL of the prepared Lottie JSON */
  file: string;
}

export interface Catalog {
  updatedAt: string;
  templates: TemplateManifest[];
}

export interface Crop {
  /** -1..1, horizontal position inside the available overflow */
  x: number;
  /** -1..1 */
  y: number;
  /** >= 1, relative to "cover" */
  zoom: number;
}

export const DEFAULT_CROP: Crop = { x: 0, y: 0, zoom: 1 };

/** Everything the user can change. Animation itself is never touched. */
export interface TemplateContent {
  lang: Lang;
  texts: Record<string, { value: string; family?: FontFamily; color?: string }>;
  /** photo sources: URL (sample / blob URL) + crop */
  photos: Record<string, { src: string; crop: Crop } | undefined>;
  colors: Record<string, string>;
  /** brand logo URL (PNG with transparency) — the logo layer is hidden when absent */
  logo?: string;
}

export interface PrepareReport {
  texts: number;
  photos: number;
  colors: number;
  duration: number;
  format: Format;
  warnings: string[];
}

// ---- minimal Lottie typings (only what the engine touches) -----------------

export type LottieValue = number | number[];

export interface LottieKeyframe {
  t: number;
  s?: any;
  e?: any;
  i?: any;
  o?: any;
  h?: number;
  [k: string]: any;
}

export interface LottieProp {
  a: 0 | 1;
  k: any;
  x?: string;
  [k: string]: any;
}

export interface LottieLayer {
  ty: number;
  nm?: string;
  ind?: number;
  refId?: string;
  ks: { [k: string]: LottieProp | any };
  masksProperties?: any[];
  hasMask?: boolean;
  shapes?: any[];
  t?: any;
  ef?: any[];
  ddd?: number;
  hd?: boolean;
  ip: number;
  op: number;
  [k: string]: any;
}

export interface LottieAsset {
  id: string;
  w?: number;
  h?: number;
  u?: string;
  p?: string;
  e?: number;
  layers?: LottieLayer[];
  [k: string]: any;
}

export interface LottieAnimation {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm?: string;
  ddd?: number;
  assets: LottieAsset[];
  layers: LottieLayer[];
  fonts?: { list: any[] };
  chars?: any[];
  markers?: any[];
  [k: string]: any;
}
