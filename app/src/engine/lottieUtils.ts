import type { LottieAnimation, LottieLayer, LottieProp } from './types';

/** Every layer list in the animation: root + precomps. */
export function allLayerLists(anim: LottieAnimation): LottieLayer[][] {
  const lists: LottieLayer[][] = [anim.layers];
  for (const a of anim.assets || []) if (Array.isArray(a.layers)) lists.push(a.layers);
  return lists;
}

export function forEachLayer(anim: LottieAnimation, fn: (layer: LottieLayer) => void) {
  for (const list of allLayerLists(anim)) for (const l of list) fn(l);
}

export type TagKind = 'txt' | 'img' | 'col';

/** "#txt_title" → { kind: 'txt', key: 'title' }. Anything after a space is ignored ("#img_photo1 copy"). */
export function parseTag(name: string | undefined): { kind: TagKind; key: string } | null {
  if (!name) return null;
  const m = /^#(txt|img|col)_([A-Za-z0-9_-]+)/.exec(name.trim());
  if (!m) return null;
  return { kind: m[1] as TagKind, key: m[2].toLowerCase() };
}

// ---- colors ----------------------------------------------------------------

export function hexToRgba(hex: string): [number, number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

export function rgbaToHex(c: number[]): string {
  const to = (v: number) => {
    // Lottie colors are 0..1, but some exporters write 0..255
    const x = v > 1 ? v : v * 255;
    return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  };
  return `#${to(c[0] ?? 0)}${to(c[1] ?? 0)}${to(c[2] ?? 0)}`;
}

// ---- property helpers ------------------------------------------------------

export function isAnimated(p: LottieProp | undefined): boolean {
  return !!p && p.a === 1 && Array.isArray(p.k) && typeof p.k[0] === 'object';
}

/** Applies fn to the value(s) of a property (static value, or every keyframe start/end value). */
export function mapProp(p: LottieProp | undefined, fn: (v: any) => any) {
  if (!p || p.k === undefined) return;
  if (isAnimated(p)) {
    for (const kf of p.k) {
      if (kf.s !== undefined) kf.s = fn(kf.s);
      if (kf.e !== undefined) kf.e = fn(kf.e);
    }
  } else {
    p.k = fn(p.k);
  }
}

export function firstValue(p: LottieProp | undefined): any {
  if (!p) return undefined;
  if (isAnimated(p)) return p.k[0].s;
  return p.k;
}

function vec(v: any, len = 3, fill = 0): number[] {
  const arr = Array.isArray(v) ? v.slice() : [v];
  while (arr.length < len) arr.push(fill);
  return arr;
}

/** Scales a Lottie shape path ({v,i,o,c}) by f, after translating by -offset. */
function scaleShape(shape: any, f: number, offset: [number, number]) {
  if (!shape || !Array.isArray(shape.v)) return shape;
  return {
    ...shape,
    v: shape.v.map((p: number[]) => [(p[0] - offset[0]) * f, (p[1] - offset[1]) * f]),
    i: (shape.i || []).map((p: number[]) => [p[0] * f, p[1] * f]),
    o: (shape.o || []).map((p: number[]) => [p[0] * f, p[1] * f]),
  };
}

/**
 * Re-maps a layer's local space: new local point q = f * (p - offset).
 * Keeps the rendered result identical:
 *   anchor' = f * (anchor - offset), scale' = scale / f, masks transformed the same way.
 * Used to turn a text box into an image (offset = box position) and to raise the
 * resolution of image assets for 1080p / 4K export (f > 1) or lower it for thumbnails (f < 1).
 */
export function remapLayerSpace(layer: LottieLayer, f: number, offset: [number, number] = [0, 0]) {
  const ks = layer.ks || (layer.ks = {});
  if (!ks.a) ks.a = { a: 0, k: [0, 0, 0] };
  if (!ks.s) ks.s = { a: 0, k: [100, 100, 100] };
  mapProp(ks.a, (v) => {
    const a = vec(v);
    return [(a[0] - offset[0]) * f, (a[1] - offset[1]) * f, a[2] ?? 0];
  });
  if (f !== 1) {
    mapProp(ks.s, (v) => vec(v, 3, 100).map((x: number, i: number) => (i < 2 ? x / f : x)));
  }
  for (const m of layer.masksProperties || []) {
    if (!m.pt) continue;
    if (isAnimated(m.pt)) {
      for (const kf of m.pt.k) {
        if (Array.isArray(kf.s)) kf.s = kf.s.map((s: any) => scaleShape(s, f, offset));
        if (Array.isArray(kf.e)) kf.e = kf.e.map((s: any) => scaleShape(s, f, offset));
      }
    } else {
      m.pt.k = scaleShape(m.pt.k, f, offset);
    }
  }
}

/** Visits fill / stroke items of a shape tree. */
export function forEachPaint(shapes: any[] | undefined, fn: (item: any) => void) {
  for (const it of shapes || []) {
    if (!it) continue;
    if (it.ty === 'fl' || it.ty === 'st') fn(it);
    if (it.ty === 'gr') forEachPaint(it.it, fn);
  }
}

/** Shape types / features that lottie (canvas renderer, mobile players) does not support well. */
export function scanUnsupported(anim: LottieAnimation, slotAssetIds: Set<string> = new Set()): string[] {
  const warnings = new Set<string>();
  const visitShapes = (shapes: any[] | undefined, layerName: string) => {
    for (const it of shapes || []) {
      if (!it) continue;
      if (it.ty === 'mm') warnings.add(`« ${layerName} » : « Fusionner les tracés » (merge paths) n'est pas supporté.`);
      if (it.ty === 'gf' || it.ty === 'gs')
        if (layerName.startsWith('#col_')) warnings.add(`« ${layerName} » : dégradé sur un calque couleur — seules les couleurs unies sont remplaçables.`);
      if (it.ty === 'gr') visitShapes(it.it, layerName);
    }
  };
  const hasExpr = (o: any): boolean => {
    if (!o || typeof o !== 'object') return false;
    if (typeof o.x === 'string' && o.x.length > 0) return true;
    for (const k of Object.keys(o)) if (typeof o[k] === 'object' && hasExpr(o[k])) return true;
    return false;
  };
  forEachLayer(anim, (l) => {
    const n = l.nm || `calque ${l.ind}`;
    if (l.ddd === 1) warnings.add(`« ${n} » : calque 3D — rendu 2D uniquement.`);
    if (Array.isArray(l.ef) && l.ef.length) warnings.add(`« ${n} » : effets After Effects (${l.ef.map((e: any) => e.nm).join(', ')}) — ignorés par Lottie.`);
    if (Array.isArray(l.sy) && l.sy.length) warnings.add(`« ${n} » : styles de calque (ombre portée…) — ignorés par Lottie.`);
    if (l.ty === 5 && Array.isArray(l.t?.a) && l.t.a.length) {
      warnings.add(`« ${n} » : animateurs de texte — remplacés par une image ; animez plutôt le calque (position, échelle, opacité, masque).`);
    }
    if (l.ty === 5 && !parseTag(l.nm)) warnings.add(`« ${n} » : texte non modifiable (pas de #txt_) — les textes figés ne s'affichent pas bien en arabe, convertissez-le en formes.`);
    if (hasExpr(l.ks)) warnings.add(`« ${n} » : expressions — à convertir en images clés (Animation > Convertir l'expression en images clés).`);
    if (l.tt) warnings.add(`« ${n} » : cache par approche (track matte) — préférez un masque, mieux supporté par les lecteurs mobiles.`);
    visitShapes(l.shapes, n);
  });
  for (const a of anim.assets || []) {
    if (!a.layers && !slotAssetIds.has(a.id) && a.p && !a.e && !String(a.p).startsWith('data:')) {
      warnings.add(`Image « ${a.p} » non intégrée : cochez « Include in json » dans Bodymovin, sinon elle sera absente.`);
    }
  }
  return [...warnings];
}
