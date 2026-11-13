/**
 * A tiny Lottie authoring DSL — "bibliothèque de briques réutilisables".
 * Produces JSON with the same structure as a Bodymovin export from After Effects
 * (real text layers named #txt_*, image layers #img_*, shape layers #col_*),
 * so the sample templates go through exactly the same pipeline as AE templates.
 */
import { hexToRgba } from '../src/engine/lottieUtils';
import type { LottieAnimation, LottieLayer } from '../src/engine/types';

export type Ease = [number, number, number, number];
export const E = {
  out: [0.16, 1, 0.3, 1] as Ease, // expo out
  outSoft: [0.25, 0.8, 0.25, 1] as Ease,
  inOut: [0.65, 0, 0.35, 1] as Ease,
  in: [0.7, 0, 0.84, 0] as Ease,
  back: [0.34, 1.56, 0.64, 1] as Ease,
  linear: [0, 0, 1, 1] as Ease,
  sine: [0.37, 0, 0.63, 1] as Ease,
};

type Val = number | number[];
export type Kf = [t: number, v: Val, ease?: Ease] | [t: number, v: Val, ease: Ease | undefined, hold: true];
export type PropIn = Val | { a: 1; k: any[] } | { a: 0; k: any };

const arr = (v: Val) => (Array.isArray(v) ? v : [v]);

/** Animated property from [frame, value, ease] keyframes. Ease applies to the segment that starts at the keyframe. */
export function kf(...frames: Kf[]): { a: 1; k: any[] } {
  const sorted = [...frames].sort((a, b) => a[0] - b[0]);
  return {
    a: 1,
    k: sorted.map((f, i) => {
      const out: any = { t: f[0], s: arr(f[1]) };
      if (i < sorted.length - 1) {
        const e = f[2] || E.out;
        out.o = { x: [e[0]], y: [e[1]] };
        out.i = { x: [e[2]], y: [e[3]] };
        if (f[3]) out.h = 1;
      }
      return out;
    }),
  };
}

export function prop(v: PropIn | undefined, def: Val) {
  if (v === undefined) return { a: 0, k: def };
  if (typeof v === 'object' && !Array.isArray(v) && 'a' in v) return v;
  return { a: 0, k: v };
}

export interface KS {
  p?: PropIn;
  a?: PropIn;
  s?: PropIn;
  r?: PropIn;
  o?: PropIn;
}

export function ks(t: KS = {}) {
  return {
    o: prop(t.o, 100),
    r: prop(t.r, 0),
    p: prop(t.p, [0, 0, 0]),
    a: prop(t.a, [0, 0, 0]),
    s: prop(t.s, [100, 100, 100]),
  };
}

// ---- shape items ----------------------------------------------------------

export const rect = (w: number, h: number, opts: { p?: PropIn; r?: PropIn } = {}) => ({
  ty: 'rc', d: 1, nm: 'Rect', s: { a: 0, k: [w, h] }, p: prop(opts.p, [0, 0]), r: prop(opts.r, 0),
});
/** Rectangle whose size is animated: frames of [t, [w,h], ease] */
export const rectAnim = (size: { a: 1; k: any[] }, opts: { p?: PropIn; r?: PropIn } = {}) => ({
  ty: 'rc', d: 1, nm: 'Rect', s: size, p: prop(opts.p, [0, 0]), r: prop(opts.r, 0),
});
export const ellipse = (w: number, h: number, p: PropIn = [0, 0]) => ({
  ty: 'el', d: 1, nm: 'Ellipse', s: { a: 0, k: [w, h] }, p: prop(p, [0, 0]),
});
export const ellipseAnim = (size: { a: 1; k: any[] }, p: PropIn = [0, 0]) => ({
  ty: 'el', d: 1, nm: 'Ellipse', s: size, p: prop(p, [0, 0]),
});
export function pathShape(points: number[][], closed = true, inT?: number[][], outT?: number[][]) {
  return {
    c: closed,
    v: points,
    i: inT || points.map(() => [0, 0]),
    o: outT || points.map(() => [0, 0]),
  };
}
export const path = (points: number[][], closed = true, inT?: number[][], outT?: number[][]) => ({
  ty: 'sh', nm: 'Path', ks: { a: 0, k: pathShape(points, closed, inT, outT) },
});
export const fill = (hex: string, o: PropIn = 100) => ({ ty: 'fl', nm: 'Fill', c: { a: 0, k: hexToRgba(hex) }, o: prop(o, 100), r: 1 });
export const stroke = (hex: string, w: number, o: PropIn = 100) => ({
  ty: 'st', nm: 'Stroke', c: { a: 0, k: hexToRgba(hex) }, o: prop(o, 100), w: { a: 0, k: w }, lc: 2, lj: 2, ml: 4,
});
export const trim = (s: PropIn, e: PropIn, o: PropIn = 0) => ({ ty: 'tm', nm: 'Trim', s: prop(s, 0), e: prop(e, 100), o: prop(o, 0), m: 1 });
/** Linear gradient: stops [[pos, hex, alpha], ...] */
/** type 1 = linear, 2 = radial (start = center, end = point on the edge) */
export function gradient(stops: [number, string, number][], start: number[], end: number[], type: 1 | 2 = 1) {
  const colors: number[] = [];
  const alphas: number[] = [];
  for (const [pos, hex, a] of stops) {
    const c = hexToRgba(hex);
    colors.push(pos, c[0], c[1], c[2]);
    alphas.push(pos, a);
  }
  return {
    ty: 'gf', nm: 'Gradient', o: { a: 0, k: 100 }, r: 1, t: type,
    s: { a: 0, k: start }, e: { a: 0, k: end },
    g: { p: stops.length, k: { a: 0, k: [...colors, ...alphas] } },
    ...(type === 2 ? { h: { a: 0, k: 0 }, a: { a: 0, k: 0 } } : {}),
  };
}
/** AE stack order: paths, then modifiers (trim, repeater), then paints (stroke, fill). */
export function ordered(items: any[]) {
  const rank = (it: any) => (it.ty === 'tm' ? 1 : it.ty === 'st' || it.ty === 'fl' || it.ty === 'gf' ? 2 : it.ty === 'rp' ? 3 : 0);
  return items.map((it, i) => [it, i] as const).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([it]) => it);
}

export function group(items: any[], t: KS & { p?: PropIn } = {}) {
  items = ordered(items);
  const k = ks(t);
  return {
    ty: 'gr', nm: 'Group',
    it: [
      ...items,
      { ty: 'tr', p: k.p, a: k.a, s: k.s, r: k.r, o: k.o, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ],
  };
}
export const repeatShape = (copies: number, offsetP: number[], rot = 0) => ({
  ty: 'rp', nm: 'Repeater', c: { a: 0, k: copies }, o: { a: 0, k: 0 }, m: 1,
  tr: { ty: 'tr', p: { a: 0, k: offsetP }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: rot }, so: { a: 0, k: 100 }, eo: { a: 0, k: 100 } },
});

// ---- masks ----------------------------------------------------------------

export const rectPts = (x: number, y: number, w: number, h: number) => [
  [x, y], [x + w, y], [x + w, y + h], [x, y + h],
];

/** Static or animated mask. frames: [t, [x,y,w,h], ease] */
export function maskRect(frames: [number, number[], Ease?][] | number[]) {
  if (typeof frames[0] === 'number') {
    const [x, y, w, h] = frames as number[];
    return { inv: false, mode: 'a', nm: 'Mask', o: { a: 0, k: 100 }, x: { a: 0, k: 0 }, pt: { a: 0, k: pathShape(rectPts(x, y, w, h)) } };
  }
  const fr = frames as [number, number[], Ease?][];
  return {
    inv: false, mode: 'a', nm: 'Mask', o: { a: 0, k: 100 }, x: { a: 0, k: 0 },
    pt: {
      a: 1,
      k: fr.map(([t, r, e], i) => {
        const o: any = { t, s: [pathShape(rectPts(r[0], r[1], r[2], r[3]))] };
        if (i < fr.length - 1) {
          const ee = e || E.out;
          o.o = { x: [ee[0]], y: [ee[1]] };
          o.i = { x: [ee[2]], y: [ee[3]] };
        }
        return o;
      }),
    },
  };
}

const K = 0.5522847498;
/** Ellipse path (cx, cy, rx, ry) as bezier points, for masks. */
export function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return pathShape(
    [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
    true,
    [[-rx * K, 0], [0, -ry * K], [rx * K, 0], [0, ry * K]],
    [[rx * K, 0], [0, ry * K], [-rx * K, 0], [0, -ry * K]],
  );
}
export function maskEllipse(frames: [number, number[], Ease?][] | number[]) {
  if (typeof frames[0] === 'number') {
    const [cx, cy, rx, ry] = frames as number[];
    return { inv: false, mode: 'a', nm: 'Mask', o: { a: 0, k: 100 }, x: { a: 0, k: 0 }, pt: { a: 0, k: ellipsePath(cx, cy, rx, ry) } };
  }
  const fr = frames as [number, number[], Ease?][];
  return {
    inv: false, mode: 'a', nm: 'Mask', o: { a: 0, k: 100 }, x: { a: 0, k: 0 },
    pt: {
      a: 1,
      k: fr.map(([t, r, e], i) => {
        const o: any = { t, s: [ellipsePath(r[0], r[1], r[2], r[3])] };
        if (i < fr.length - 1) {
          const ee = e || E.out;
          o.o = { x: [ee[0]], y: [ee[1]] };
          o.i = { x: [ee[2]], y: [ee[3]] };
        }
        return o;
      }),
    },
  };
}
/** Arch window shape (rounded top), for masks. */
export function archPath(x: number, y: number, w: number, h: number) {
  const r = w / 2;
  return pathShape(
    [[x, y + h], [x, y + r], [x + r, y], [x + w, y + r], [x + w, y + h]],
    true,
    [[0, 0], [0, 0], [-r * K, 0], [0, -r * K], [0, 0]],
    [[0, 0], [0, -r * K], [r * K, 0], [0, 0], [0, 0]],
  );
}

// ---- composition ------------------------------------------------------------

export interface TextOpts {
  text: string;
  font?: string; // e.g. 'Cairo-Bold'
  size: number;
  color?: string;
  justify?: 'left' | 'right' | 'center';
  box: [number, number];
  lineHeight?: number;
  tracking?: number;
  caps?: boolean;
}

interface LayerOpts {
  ip?: number;
  op?: number;
  parent?: number;
  masks?: any[];
}

const FONT_STYLES: Record<string, string> = {
  Regular: 'Regular', Medium: 'Medium', SemiBold: 'SemiBold', Bold: 'Bold', ExtraBold: 'ExtraBold', Black: 'Black', Light: 'Light',
};

export class Comp {
  layers: LottieLayer[] = [];
  assets: any[] = [];
  fonts = new Map<string, any>();
  private ind = 0;
  constructor(public name: string, public w: number, public h: number, public seconds: number, public fr = 30) {}
  get op() {
    return Math.round(this.seconds * this.fr);
  }
  /** seconds → frames */
  f = (s: number) => Math.round(s * this.fr);

  private base(ty: number, nm: string, t: KS, o: LayerOpts): LottieLayer {
    const layer: any = {
      ddd: 0, ind: ++this.ind, ty, nm, sr: 1, ks: ks(t), ao: 0,
      ip: o.ip ?? 0, op: o.op ?? this.op, st: 0, bm: 0,
    };
    if (o.parent) layer.parent = o.parent;
    if (o.masks?.length) {
      layer.hasMask = true;
      layer.masksProperties = o.masks;
    }
    this.layers.push(layer);
    return layer;
  }

  shape(nm: string, items: any[], t: KS = {}, o: LayerOpts = {}) {
    const l = this.base(4, nm, t, o);
    l.shapes = ordered(items);
    return l;
  }

  nul(nm: string, t: KS = {}, o: LayerOpts = {}) {
    return this.base(3, nm, t, o);
  }

  /** Text layer — positioned by the center of its box. */
  text(nm: string, opts: TextOpts, t: KS = {}, o: LayerOpts = {}) {
    const fName = opts.font || 'Cairo-Bold';
    const [family, style = 'Regular'] = fName.split('-');
    const fam = family.replace(/([a-z])([A-Z])/g, '$1 $2');
    this.fonts.set(fName, { fName, fFamily: fam, fStyle: FONT_STYLES[style] || style, ascent: 75 });
    const l = this.base(5, nm, t, o);
    const j = opts.justify === 'right' ? 1 : opts.justify === 'center' ? 2 : 0;
    l.t = {
      d: {
        k: [{
          t: 0,
          s: {
            s: opts.size, f: fName, t: opts.text, j, tr: opts.tracking ?? 0,
            lh: (opts.lineHeight ?? 1.15) * opts.size, ls: 0,
            fc: hexToRgba(opts.color || '#ffffff').slice(0, 3),
            sz: opts.box, ps: [-opts.box[0] / 2, -opts.box[1] / 2],
            ...(opts.caps ? { ca: 1 } : {}),
          },
        }],
      },
      p: {}, m: { g: 1, a: { a: 0, k: [0, 0] } }, a: [],
    };
    return l;
  }

  /** Image layer — anchor at the center of the image. */
  image(nm: string, assetId: string, w: number, h: number, t: KS = {}, o: LayerOpts = {}) {
    if (!this.assets.find((a) => a.id === assetId)) this.assets.push({ id: assetId, w, h, u: 'images/', p: `${assetId}.jpg`, e: 0 });
    const l = this.base(2, nm, { a: [w / 2, h / 2, 0], ...t }, o);
    l.refId = assetId;
    return l;
  }

  /** Full-frame background (solid shape). */
  background(nm: string, hex: string) {
    return this.shape(nm, [rect(this.w + 4, this.h + 4), fill(hex)], { p: [this.w / 2, this.h / 2, 0] });
  }

  build(): LottieAnimation {
    return {
      v: '5.12.2', fr: this.fr, ip: 0, op: this.op, w: this.w, h: this.h, nm: this.name, ddd: 0,
      assets: this.assets,
      fonts: { list: [...this.fonts.values()] },
      // Last added = on top → Lottie lists the top layer first
      layers: [...this.layers].reverse(),
      markers: [],
    };
  }
}

// ---- reusable motion bricks ------------------------------------------------

/** Slide-up + fade in at frame t. */
export function riseIn(_c: Comp, t: number, x: number, y: number, dist = 80, dur = 18): KS {
  return {
    p: kf([t, [x, y + dist, 0], E.out], [t + dur, [x, y, 0]]),
    o: kf([t, 0, E.outSoft], [t + Math.round(dur * 0.7), 100]),
  };
}

/** Scale pop with overshoot at frame t. */
export function popIn(t: number, x: number, y: number, dur = 16, from = 0): KS {
  return {
    p: [x, y, 0],
    s: kf([t, [from, from, 100], E.back], [t + dur, [100, 100, 100]]),
    o: kf([t, 0, E.linear], [t + 4, 100]),
  };
}

/** Slow push-in on a photo (Ken Burns). */
export function kenBurns(t0: number, t1: number, x: number, y: number, from = 112, to = 100): KS {
  return { p: [x, y, 0], s: kf([t0, [from, from, 100], E.sine], [t1, [to, to, 100]]) };
}

/** Fade out at the end (for clean loops). */
export function withFadeOut(k: KS, t: number, dur = 10): KS {
  const o = k.o as any;
  if (o && o.a === 1) {
    const last = o.k[o.k.length - 1];
    last.o = { x: [0.4], y: [0] };
    last.i = { x: [0.6], y: [1] };
    o.k.push({ t, s: [100], o: { x: [0.4], y: [0] }, i: { x: [0.6], y: [1] } }, { t: t + dur, s: [0] });
    return k;
  }
  return { ...k, o: kf([t, 100, E.inOut], [t + dur, 0]) };
}
