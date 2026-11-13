import { describe, expect, it } from 'vitest';
import { applyContent, defaultContent, type Renderers } from '../apply';
import { parseTag, remapLayerSpace } from '../lottieUtils';
import { buildManifest, detectFormat, matchFont, prepareTemplate, weightFromStyle } from '../prepare';
import { Comp, E, fill, kf, maskRect, rect } from '../../../tools/dsl';
import { SAMPLE_TEMPLATES } from '../../../tools/templates';

function sample() {
  const c = new Comp('Test', 1080, 1920, 8);
  c.background('#col_principale', '#112233');
  c.image('#img_photo1', 'img_0', 1080, 1200, { p: [540, 600, 0] }, { masks: [maskRect([0, 0, 1080, 1200])] });
  c.shape('#col_accent', [rect(200, 10), fill('#C9A227')], { p: [100, 1300, 0] });
  c.text('#txt_titre', { text: 'JUST LISTED', font: 'Cairo-Bold', size: 100, box: [900, 140] }, { p: [540, 1400, 0], o: kf([0, 0, E.out], [20, 100]) });
  c.text('static', { text: 'not editable', size: 40, box: [500, 60] }, { p: [540, 1800, 0] });
  c.image('#img_logo', 'logo', 200, 200, { p: [950, 150, 0] });
  return c.build();
}

const stubRenderers: Renderers = {
  text: async (slot, value, _s, scale) => `text:${slot.key}:${value}:${scale}`,
  photo: async (src, _c, w, h) => `photo:${src}:${w}x${h}`,
  logo: async (src, w, h) => `logo:${src}:${w}x${h}`,
};

describe('layer naming convention', () => {
  it('parses #txt_ / #img_ / #col_ tags', () => {
    expect(parseTag('#txt_titre')).toEqual({ kind: 'txt', key: 'titre' });
    expect(parseTag('#img_photo1 copy')).toEqual({ kind: 'img', key: 'photo1' });
    expect(parseTag('#col_Principale')).toEqual({ kind: 'col', key: 'principale' });
    expect(parseTag('Shape Layer 1')).toBeNull();
  });
  it('maps AE fonts and formats', () => {
    expect(matchFont('ElMessiri')).toBe('El Messiri');
    expect(matchFont('Helvetica')).toBe('Cairo');
    expect(weightFromStyle('SemiBold')).toBe(600);
    expect(weightFromStyle('ExtraBold')).toBe(800);
    expect(detectFormat(1080, 1920)).toBe('9:16');
    expect(detectFormat(1080, 1350)).toBe('4:5');
    expect(detectFormat(1920, 1080)).toBe('16:9');
  });
});

describe('prepareTemplate', () => {
  const p = prepareTemplate(sample());
  it('builds the template sheet', () => {
    expect(p.texts.map((t) => t.key)).toEqual(['titre']);
    expect(p.photos.map((t) => t.key)).toEqual(['photo1']);
    expect(p.colors.map((c) => [c.key, c.default])).toEqual([['principale', '#112233'], ['accent', '#c9a227']]);
    expect(p.hasLogo).toBe(true);
    expect(p.report.format).toBe('9:16');
    expect(p.report.duration).toBe(8);
    expect(p.aeTexts.titre).toBe('JUST LISTED');
  });
  it('converts editable text layers into image layers with the same placement', () => {
    const layer = p.lottie.layers.find((l) => l.nm === '#txt_titre')!;
    expect(layer.ty).toBe(2);
    expect(layer.refId).toBe('txt_titre');
    expect(layer.t).toBeUndefined();
    // box was centred on the layer origin: ps = [-450, -70] → anchor = -ps
    expect(layer.ks.a.k.slice(0, 2)).toEqual([450, 70]);
    const asset = p.lottie.assets.find((a) => a.id === 'txt_titre')!;
    expect([asset.w, asset.h]).toEqual([900, 140]);
    const slot = p.texts[0];
    expect(slot.style.family).toBe('Cairo');
    expect(slot.style.weight).toBe(700);
    expect(slot.maxChars).toBeGreaterThan(10);
  });
  it('warns about non-editable text (bad for Arabic)', () => {
    expect(p.report.warnings.some((w) => w.includes('static'))).toBe(true);
  });
  it('keeps the input untouched', () => {
    const input = sample();
    const before = JSON.stringify(input);
    prepareTemplate(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('remapLayerSpace', () => {
  it('keeps the rendered result identical (anchor, scale, masks)', () => {
    const layer: any = {
      ty: 2, ip: 0, op: 10,
      ks: { a: { a: 0, k: [10, 20, 0] }, s: { a: 0, k: [100, 100, 100] } },
      masksProperties: [{ pt: { a: 0, k: { c: true, v: [[0, 0], [10, 0]], i: [[0, 0], [1, 1]], o: [[0, 0], [0, 0]] } } }],
    };
    remapLayerSpace(layer, 2, [5, 5]);
    expect(layer.ks.a.k).toEqual([10, 30, 0]);
    expect(layer.ks.s.k).toEqual([50, 50, 100]);
    expect(layer.masksProperties[0].pt.k.v).toEqual([[-10, -10], [10, -10]]);
    expect(layer.masksProperties[0].pt.k.i[1]).toEqual([2, 2]);
  });
});

describe('applyContent', () => {
  const p = prepareTemplate(sample());
  const m = buildManifest(p, {
    id: 'test', name: { en: 'Test', ar: 'اختبار' }, category: 'real-estate', usages: ['real-estate'], pro: false,
    defaults: { en: {}, ar: { titre: 'معروض حديثاً' } }, samples: { photo1: 'samples/villa.jpg' },
  });

  it('only changes content: texts, photos, colors, logo', async () => {
    const content = defaultContent(m, 'ar');
    content.colors.principale = '#ff0000';
    const out = await applyContent(p.lottie, m, content, stubRenderers);
    const a = (id: string) => out.assets.find((x) => x.id === id)!;
    expect(a('txt_titre').p).toBe('text:titre:معروض حديثاً:1');
    expect(a('img_0').p).toBe('photo:samples/villa.jpg:1080x1200');
    const bg = out.layers.find((l) => l.nm === '#col_principale')!;
    expect(bg.shapes!.find((s: any) => s.ty === 'fl').c.k).toEqual([1, 0, 0, 1]);
    // no logo in the brand kit → logo layer hidden
    expect(out.layers.find((l) => l.refId === 'logo')!.hd).toBe(true);
    // animation untouched
    const t = out.layers.find((l) => l.nm === '#txt_titre')!;
    expect(t.ks.o).toEqual(p.lottie.layers.find((l) => l.nm === '#txt_titre')!.ks.o);
    expect(out.op).toBe(p.lottie.op);
  });

  it('raises image resolution for 4K without moving anything', async () => {
    const content = { ...defaultContent(m, 'en'), logo: 'brand.png' };
    const out = await applyContent(p.lottie, m, content, stubRenderers, { scale: 2 });
    expect(out.assets.find((x) => x.id === 'txt_titre')!.w).toBe(1800);
    expect(out.assets.find((x) => x.id === 'logo')!.p).toBe('logo:brand.png:400x400');
    const t = out.layers.find((l) => l.nm === '#txt_titre')!;
    expect(t.ks.s.k.slice(0, 2)).toEqual([50, 50]);
    expect(t.ks.a.k.slice(0, 2)).toEqual([900, 140]);
  });
});

describe('sample catalog', () => {
  it('every sample template follows the rules of the spec', () => {
    for (const s of SAMPLE_TEMPLATES) {
      const p = prepareTemplate(s.build().build());
      expect(p.report.warnings, s.meta.id).toEqual([]);
      expect(p.report.duration, s.meta.id).toBeGreaterThanOrEqual(6);
      expect(p.report.duration, s.meta.id).toBeLessThanOrEqual(15);
      expect(p.texts.length, s.meta.id).toBeGreaterThanOrEqual(1);
      expect(p.texts.length, s.meta.id).toBeLessThanOrEqual(5);
      expect(p.photos.length, s.meta.id).toBeLessThanOrEqual(5);
      for (const t of p.texts) {
        expect(s.meta.defaults.en[t.key], `${s.meta.id}.${t.key} en`).toBeTruthy();
        expect(s.meta.defaults.ar[t.key], `${s.meta.id}.${t.key} ar`).toMatch(/[؀-ۿ]|^-?\d/);
      }
      for (const ph of p.photos) expect(s.meta.samples?.[ph.key], `${s.meta.id}.${ph.key}`).toBeTruthy();
    }
  });
});
