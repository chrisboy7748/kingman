/**
 * Sample catalog — 15 templates built from the motion bricks of dsl.ts.
 * Each one goes through prepareTemplate() exactly like an After Effects export.
 */
import type { ManifestMeta } from '../src/engine/prepare';
import {
  Comp, E, archPath, ellipse, fill, gradient, group, kenBurns, kf, maskEllipse, maskRect, path, popIn, rect,
  repeatShape, riseIn, stroke, trim, withFadeOut, type KS,
} from './dsl';

export interface SampleTemplate {
  meta: ManifestMeta;
  build(): Comp;
}

const W = 1080;
const H = 1920;

/** Left-anchored horizontal reveal (scale X 0 → 100). */
function barReveal(t: number, x: number, y: number, dur = 16): KS {
  return { p: [x, y, 0], s: kf([t, [0, 100, 100], E.out], [t + dur, [100, 100, 100]]) };
}

const fade = (t: number, dur = 12): KS['o'] => kf([t, 0, E.outSoft], [t + dur, 100]);

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  // ---------------------------------------------------------------- REAL ESTATE
  {
    meta: {
      id: 'just-listed',
      name: { en: 'Just Listed', ar: 'معروض حديثاً' },
      category: 'real-estate', usages: ['real-estate'], tags: ['listing', 'villa', 'new', 'property'],
      pro: false, music: 'luxe', publishedAt: '2026-11-09', trending: 96,
      samples: { photo1: 'samples/villa.jpg' },
      defaults: {
        en: { title: 'JUST LISTED', address: 'Palm Jumeirah, Dubai', price: 'AED 12,500,000', details: '5 Beds  ·  6 Baths  ·  7,200 sq.ft' },
        ar: { title: 'معروض حديثاً', address: 'نخلة جميرا، دبي', price: '12,500,000 درهم', details: '5 غرف  ·  6 حمامات  ·  7,200 قدم²' },
      },
    },
    build() {
      const c = new Comp('Just Listed', W, H, 8);
      const f = c.f;
      c.background('#col_secondary', '#0E1A2B');
      c.image('#img_photo1', 'img_photo1', 1080, 1240, kenBurns(0, c.op, 540, 620, 112, 100), {
        masks: [maskRect([[0, [0, 0, 1080, 0], E.inOut], [f(1), [0, 0, 1080, 1240]]])],
      });
      c.shape('shade', [rect(1080, 420), gradient([[0, '#000000', 0], [1, '#000000', 0.55]], [0, -210], [0, 210])], { p: [540, 1030, 0] });
      c.shape('#col_secondary', [rect(1080, 780), fill('#0E1A2B')], { p: kf([f(0.3), [540, 2400, 0], E.out], [f(1.1), [540, 1570, 0]]) });
      c.shape('#col_primary', [rect(220, 10, { p: [110, 0] }), fill('#C9A227')], barReveal(f(0.9), 90, 1270));
      c.text('#txt_title', { text: 'JUST LISTED', font: 'Cairo-ExtraBold', size: 118, box: [900, 150], tracking: 20 }, riseIn(c, f(1), 540, 1370));
      c.text('#txt_address', { text: 'Palm Jumeirah, Dubai', font: 'Cairo-Regular', size: 50, color: '#D5DCE6', box: [900, 72] }, riseIn(c, f(1.2), 540, 1480));
      c.shape('#col_primary', [rect(640, 112, { p: [320, 0], r: 56 }), fill('#C9A227')], barReveal(f(1.4), 90, 1630, 18));
      c.text('#txt_price', { text: 'AED 12,500,000', font: 'Cairo-Bold', size: 56, color: '#0E1A2B', justify: 'center', box: [580, 84] }, { p: [410, 1630, 0], o: fade(f(1.7)) });
      c.text('#txt_details', { text: '5 Beds · 6 Baths · 7,200 sq.ft', font: 'Cairo-Medium', size: 40, color: '#FFFFFF', box: [900, 60] }, riseIn(c, f(1.9), 540, 1770));
      c.image('#img_logo', 'logo', 200, 200, popIn(f(1.4), 950, 140, 16));
      return c;
    },
  },
  {
    meta: {
      id: 'property-tour',
      name: { en: 'Property Tour', ar: 'جولة في العقار' },
      category: 'real-estate', usages: ['real-estate'], tags: ['tour', 'photos', 'slideshow', 'property'],
      pro: true, music: 'golden-hour', publishedAt: '2026-11-10', trending: 88,
      samples: { photo1: 'samples/villa.jpg', photo2: 'samples/living.jpg', photo3: 'samples/bedroom.jpg', photo4: 'samples/pool.jpg' },
      defaults: {
        en: { title: 'Property Tour', line1: 'Living Room', line2: 'Master Bedroom', line3: 'Private Pool', cta: 'Book a viewing' },
        ar: { title: 'جولة في العقار', line1: 'غرفة المعيشة', line2: 'غرفة النوم الرئيسية', line3: 'مسبح خاص', cta: 'احجز موعد المعاينة' },
      },
    },
    build() {
      const c = new Comp('Property Tour', W, H, 12);
      const f = c.f;
      c.background('#col_secondary', '#111111');
      const seg = 3;
      for (let i = 0; i < 4; i++) {
        const t0 = f(i * seg) - (i ? 10 : 0);
        const ip = Math.max(0, t0);
        c.image(`#img_photo${i + 1}`, `img_photo${i + 1}`, 1080, 1920, kenBurns(ip, f((i + 1) * seg) + 12, 540, 960, 100, 110), {
          ip, op: i === 3 ? c.op : f((i + 1) * seg) + 12,
          masks: i ? [maskRect([[t0, [1080, 0, 0, 1920], E.inOut], [t0 + 16, [0, 0, 1080, 1920]]])] : [],
        });
      }
      c.shape('shade', [rect(1080, 760), gradient([[0, '#000000', 0], [1, '#000000', 0.7]], [0, -380], [0, 380])], { p: [540, 1540, 0] });
      // intro title
      c.shape('#col_primary', [rect(120, 8, { p: [60, 0] }), fill('#E8B04B')], { ...barReveal(f(0.3), 90, 1480), o: kf([f(2.6), 100, E.inOut], [f(2.9), 0]) }, { op: f(3) });
      c.text('#txt_title', { text: 'Property Tour', font: 'ElMessiri-Bold', size: 120, box: [900, 160] }, withFadeOut(riseIn(c, f(0.4), 540, 1590), f(2.6), 8), { op: f(3) });
      // room labels
      for (let i = 1; i <= 3; i++) {
        const t = f(i * seg) + 8;
        const end = f((i + 1) * seg) - 2;
        c.shape('#col_primary', [rect(120, 8, { p: [60, 0] }), fill('#E8B04B')], { ...barReveal(t, 90, 1560), o: kf([end - 8, 100, E.inOut], [end, 0]) }, { ip: t, op: end + 1 });
        c.text(`#txt_line${i}`, { text: 'Room', font: 'Cairo-Bold', size: 84, box: [900, 120] }, withFadeOut(riseIn(c, t + 3, 540, 1660, 50), end - 8, 8), { ip: t, op: end + 1 });
      }
      // CTA at the end
      const tc = f(11.0);
      c.shape('#col_primary', [rect(700, 120, { r: 60 }), fill('#E8B04B')], popIn(f(10.2), 540, 1780, 16), { ip: f(10.2) });
      c.text('#txt_cta', { text: 'Book a viewing', font: 'Cairo-Bold', size: 52, color: '#111111', justify: 'center', box: [640, 80] }, { p: [540, 1780, 0], o: fade(tc - 18) }, { ip: f(10.2) });
      c.image('#img_logo', 'logo', 180, 180, popIn(f(0.6), 960, 130, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'sold',
      name: { en: 'Sold!', ar: 'تم البيع!' },
      category: 'real-estate', usages: ['real-estate'], tags: ['sold', 'closing', 'thank you'],
      pro: true, music: 'pop-promo', publishedAt: '2026-11-02', trending: 72,
      samples: { photo1: 'samples/tower.jpg' },
      defaults: {
        en: { title: 'SOLD', address: 'Downtown Dubai · 2 BR Apartment', subtitle: 'Thank you to our wonderful clients!' },
        ar: { title: 'تم البيع', address: 'وسط مدينة دبي · شقة غرفتين', subtitle: 'شكراً لعملائنا الكرام!' },
      },
    },
    build() {
      const c = new Comp('Sold', W, H, 7);
      const f = c.f;
      c.background('bg', '#000000');
      c.image('#img_photo1', 'img_photo1', 1080, 1920, kenBurns(0, c.op, 540, 960, 104, 116));
      c.shape('dim', [rect(1080, 1920), fill('#000000', kf([f(0.2), 0, E.inOut], [f(0.8), 45]))], { p: [540, 960, 0] });
      const stamp = c.nul('stamp', { p: [540, 820, 0], r: -8, s: kf([f(0.6), [260, 260, 100], E.in], [f(0.95), [100, 100, 100], E.back], [f(1.15), [106, 106, 100], E.out], [f(1.35), [100, 100, 100]]) });
      c.shape('#col_primary', [rect(820, 320, { r: 24 }), stroke('#E63946', 18)], { o: kf([f(0.6), 0, E.linear], [f(0.75), 100]) }, { parent: stamp.ind });
      c.shape('#col_primary', [rect(760, 260, { r: 14 }), fill('#E63946')], { o: kf([f(0.6), 0, E.linear], [f(0.75), 100]) }, { parent: stamp.ind });
      c.text('#txt_title', { text: 'SOLD', font: 'Cairo-ExtraBold', size: 190, justify: 'center', box: [720, 230], tracking: 60 }, { o: kf([f(0.6), 0, E.linear], [f(0.75), 100]) }, { parent: stamp.ind });
      // dust burst
      c.shape('burst', [group([ellipse(14, 14, [0, -260]), fill('#FFFFFF'), repeatShape(14, [0, 0], 360 / 14)])],
        { p: [540, 820, 0], s: kf([f(0.95), [60, 60, 100], E.out], [f(1.6), [150, 150, 100]]), o: kf([f(0.95), 100, E.linear], [f(1.6), 0]) }, { ip: f(0.95), op: f(1.7) });
      c.text('#txt_address', { text: 'Downtown Dubai', font: 'Cairo-Bold', size: 58, justify: 'center', box: [940, 90] }, riseIn(c, f(1.5), 540, 1180));
      c.shape('#col_primary', [rect(140, 8), fill('#E63946')], { p: [540, 1260, 0], s: kf([f(1.7), [0, 100, 100], E.out], [f(2.2), [100, 100, 100]]) });
      c.text('#txt_subtitle', { text: 'Thank you to our wonderful clients!', font: 'Cairo-Regular', size: 46, color: '#E9E9E9', justify: 'center', box: [900, 140] }, riseIn(c, f(1.9), 540, 1360));
      c.image('#img_logo', 'logo', 220, 220, popIn(f(2.3), 540, 1650, 16));
      return c;
    },
  },
  {
    meta: {
      id: 'price-features',
      name: { en: 'Price & Features', ar: 'السعر والمميزات' },
      category: 'real-estate', usages: ['real-estate'], tags: ['price', 'features', 'villa'],
      pro: true, music: 'luxe', publishedAt: '2026-11-10', trending: 80,
      samples: { photo1: 'samples/pool.jpg' },
      defaults: {
        en: { title: 'Luxury Villa', price: 'AED 8.9M', line1: 'Private beach access', line2: 'Smart home system', line3: 'Ready to move in' },
        ar: { title: 'فيلا فاخرة', price: '8.9 مليون درهم', line1: 'وصول خاص إلى الشاطئ', line2: 'نظام منزل ذكي', line3: 'جاهزة للسكن' },
      },
    },
    build() {
      const c = new Comp('Price & Features', W, H, 10);
      const f = c.f;
      c.background('#col_secondary', '#F4EFE6');
      c.image('#img_photo1', 'img_photo1', 960, 900, kenBurns(0, c.op, 540, 560, 110, 100), {
        masks: [{ ...maskRect([[f(0.1), [0, 900, 960, 0], E.inOut], [f(1.0), [0, 0, 960, 900]]]) }],
      });
      c.text('#txt_title', { text: 'Luxury Villa', font: 'Amiri-Bold', size: 96, color: '#1D1D1F', box: [920, 120] }, riseIn(c, f(0.9), 540, 1100, 60));
      c.shape('#col_primary', [rect(520, 120, { p: [260, 0], r: 16 }), fill('#1F6F5C')], barReveal(f(1.2), 80, 1240, 18));
      c.text('#txt_price', { text: 'AED 8.9M', font: 'Cairo-Bold', size: 64, justify: 'center', box: [480, 90] }, { p: [340, 1240, 0], o: fade(f(1.5)) });
      for (let i = 1; i <= 3; i++) {
        const t = f(1.8 + i * 0.3);
        const y = 1360 + i * 120;
        c.shape('#col_primary', [ellipse(26, 26), fill('#1F6F5C')], popIn(t, 105, y, 12));
        c.shape('tick', [path([[-7, 0], [-2, 5], [7, -5]], false), stroke('#FFFFFF', 4), trim(0, kf([t + 6, 0, E.out], [t + 16, 100]))], { p: [105, y, 0] });
        c.text(`#txt_line${i}`, { text: 'Feature', font: 'Cairo-Medium', size: 46, color: '#2B2B2B', box: [860, 70] }, riseIn(c, t, 580, y, 30, 14));
      }
      c.image('#img_logo', 'logo', 160, 160, popIn(f(2.8), 950, 1810, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'open-house',
      name: { en: 'Open House', ar: 'يوم مفتوح' },
      category: 'real-estate', usages: ['real-estate'], tags: ['open house', 'event', 'viewing', 'landscape'],
      pro: true, music: 'golden-hour', publishedAt: '2026-10-26', trending: 41,
      samples: { photo1: 'samples/living.jpg' },
      defaults: {
        en: { title: 'OPEN HOUSE', date: 'Saturday · 2 – 5 PM', address: 'Dubai Hills Estate' },
        ar: { title: 'يوم مفتوح', date: 'السبت · 2 – 5 مساءً', address: 'دبي هيلز استيت' },
      },
    },
    build() {
      const c = new Comp('Open House', 1920, 1080, 8);
      const f = c.f;
      c.background('#col_secondary', '#1B263B');
      c.image('#img_photo1', 'img_photo1', 1100, 1080, kenBurns(0, c.op, 550, 540, 110, 100), {
        masks: [maskRect([[0, [0, 0, 0, 1080], E.inOut], [f(1), [0, 0, 1100, 1080]]])],
      });
      c.shape('#col_primary', [rect(10, 160, { p: [0, 80] }), fill('#F2A541')], { p: [1200, 340, 0], s: kf([f(0.8), [100, 0, 100], E.out], [f(1.3), [100, 100, 100]]) });
      c.text('#txt_title', { text: 'OPEN HOUSE', font: 'Cairo-ExtraBold', size: 110, box: [640, 140] }, riseIn(c, f(0.9), 1560, 420, 60));
      c.text('#txt_date', { text: 'Saturday · 2 – 5 PM', font: 'Cairo-Bold', size: 54, color: '#F2A541', box: [640, 80] }, riseIn(c, f(1.2), 1560, 560, 40));
      c.text('#txt_address', { text: 'Dubai Hills Estate', font: 'Cairo-Regular', size: 44, color: '#E0E6EE', box: [640, 70] }, riseIn(c, f(1.4), 1560, 650, 40));
      c.image('#img_logo', 'logo', 170, 170, popIn(f(1.8), 1780, 950, 14));
      return c;
    },
  },

  // ---------------------------------------------------------------- PROMOS
  {
    meta: {
      id: 'promo-20',
      name: { en: 'Flash Sale −20%', ar: 'تخفيض سريع −20%' },
      category: 'promos', usages: ['retail', 'creator'], tags: ['sale', 'discount', 'promo', 'offer'],
      pro: false, music: 'pop-promo', publishedAt: '2026-11-11', trending: 99,
      samples: { photo1: 'samples/product.jpg' },
      defaults: {
        en: { title: 'SUMMER SALE', discount: '-20%', details: 'This weekend only', cta: 'Shop now' },
        ar: { title: 'تخفيضات الصيف', discount: '-20%', details: 'نهاية هذا الأسبوع فقط', cta: 'تسوق الآن' },
      },
    },
    build() {
      const c = new Comp('Promo -20%', W, H, 7);
      const f = c.f;
      c.background('#col_primary', '#FF4D5A');
      // rotating sunburst
      const rays = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const b = a + Math.PI / 24;
        rays.push(path([[0, 0], [Math.cos(a) * 1500, Math.sin(a) * 1500], [Math.cos(b) * 1500, Math.sin(b) * 1500]]));
      }
      c.shape('rays', [group([...rays, fill('#FFFFFF', 10)])], { p: [540, 700, 0], r: kf([0, 0, E.linear], [c.op, 40]) });
      c.shape('#col_secondary', [ellipse(760, 760), fill('#FFD23F')], { p: [540, 700, 0], s: kf([f(0.1), [0, 0, 100], E.back], [f(0.7), [100, 100, 100]]) });
      c.image('#img_photo1', 'img_photo1', 640, 640, popIn(f(0.4), 540, 700, 20), { masks: [maskEllipse([320, 320, 320, 320])] });
      c.shape('#col_secondary', [rect(560, 250, { r: 30 }), fill('#FFD23F')], { ...popIn(f(1.0), 760, 1060, 14), r: -6 });
      c.text('#txt_discount', { text: '-20%', font: 'Cairo-ExtraBold', size: 190, color: '#1A1A1A', justify: 'center', box: [520, 230] }, { ...popIn(f(1.1), 760, 1060, 16), r: -6 });
      c.text('#txt_title', { text: 'SUMMER SALE', font: 'Cairo-ExtraBold', size: 120, justify: 'center', box: [980, 160] }, riseIn(c, f(1.4), 540, 1340));
      c.text('#txt_details', { text: 'This weekend only', font: 'Cairo-Medium', size: 54, justify: 'center', box: [900, 80] }, riseIn(c, f(1.6), 540, 1470));
      c.shape('cta', [rect(560, 124, { r: 62 }), fill('#1A1A1A')], popIn(f(2.0), 540, 1670, 16));
      c.text('#txt_cta', { text: 'Shop now', font: 'Cairo-Bold', size: 54, justify: 'center', box: [500, 84] }, { p: [540, 1670, 0], o: fade(f(2.3)) });
      c.image('#img_logo', 'logo', 180, 180, popIn(f(0.5), 950, 140, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'new-arrival',
      name: { en: 'New Arrival', ar: 'وصل حديثاً' },
      category: 'promos', usages: ['retail'], tags: ['new', 'collection', 'fashion', 'arrival'],
      pro: true, music: 'golden-hour', publishedAt: '2026-11-12', trending: 77,
      samples: { photo1: 'samples/fashion1.jpg', photo2: 'samples/fashion2.jpg' },
      defaults: {
        en: { title: 'NEW ARRIVAL', subtitle: 'The Autumn Collection', cta: 'In store & online' },
        ar: { title: 'وصل حديثاً', subtitle: 'تشكيلة الخريف', cta: 'في المتجر وعبر الإنترنت' },
      },
    },
    build() {
      const c = new Comp('New Arrival', W, H, 8);
      const f = c.f;
      c.background('#col_secondary', '#F3F0EA');
      c.image('#img_photo1', 'img_photo1', 500, 1100, { p: kf([0, [290, -700, 0], E.out], [f(1.1), [290, 640, 0]]), s: kf([f(1.1), [100, 100, 100], E.sine], [c.op, [106, 106, 100]]) });
      c.image('#img_photo2', 'img_photo2', 500, 1100, { p: kf([f(0.15), [800, 2600, 0], E.out], [f(1.25), [800, 820, 0]]), s: kf([f(1.25), [100, 100, 100], E.sine], [c.op, [106, 106, 100]]) });
      c.shape('#col_primary', [rect(1080, 8), fill('#2E2A24')], { p: [540, 1480, 0], s: kf([f(1.2), [0, 100, 100], E.out], [f(1.8), [100, 100, 100]]) });
      c.text('#txt_title', { text: 'NEW ARRIVAL', font: 'ElMessiri-Bold', size: 130, color: '#2E2A24', justify: 'center', box: [1000, 170] }, {
        p: [540, 1600, 0], o: fade(f(1.4)), s: kf([f(1.4), [115, 115, 100], E.out], [f(2.2), [100, 100, 100]]),
      }, { masks: [maskRect([[f(1.4), [-500, 85, 1000, 0], E.out], [f(2.0), [-500, -85, 1000, 170]]])] });
      c.text('#txt_subtitle', { text: 'The Autumn Collection', font: 'Amiri-Regular', size: 60, color: '#5B544A', justify: 'center', box: [900, 90] }, riseIn(c, f(1.9), 540, 1730, 30));
      c.text('#txt_cta', { text: 'In store & online', font: 'Cairo-Medium', size: 40, color: '#2E2A24', justify: 'center', box: [900, 60], tracking: 80 }, { p: [540, 1830, 0], o: fade(f(2.3)) });
      c.image('#img_logo', 'logo', 160, 160, popIn(f(2.4), 540, 120, 14));
      return c;
    },
  },

  // ---------------------------------------------------------------- FOOD
  {
    meta: {
      id: 'menu-of-the-day',
      name: { en: "Today's Menu", ar: 'قائمة اليوم' },
      category: 'food', usages: ['retail'], tags: ['menu', 'restaurant', 'food', 'daily'],
      pro: false, music: 'desert-groove', publishedAt: '2026-11-11', trending: 90,
      samples: { photo1: 'samples/dish.jpg' },
      defaults: {
        en: { title: "Today's Menu", item1: 'Chicken Machboos — 45 AED', item2: 'Lamb Ouzi — 65 AED', item3: 'Luqaimat — 20 AED', cta: 'Order on WhatsApp' },
        ar: { title: 'قائمة اليوم', item1: 'مجبوس دجاج — 45 درهم', item2: 'أوزي لحم — 65 درهم', item3: 'لقيمات — 20 درهم', cta: 'اطلب عبر واتساب' },
      },
    },
    build() {
      const c = new Comp("Today's Menu", W, H, 10);
      const f = c.f;
      c.background('#col_secondary', '#FFF4E4');
      c.shape('#col_primary', [ellipse(820, 820), fill('#D9622B')], { p: [540, 620, 0], s: kf([0, [0, 0, 100], E.out], [f(0.8), [100, 100, 100]]) });
      c.shape('dots', [group([ellipse(16, 16, [0, -470]), fill('#D9622B'), repeatShape(36, [0, 0], 10)])], { p: [540, 620, 0], r: kf([0, 0, E.linear], [c.op, 60]), o: fade(f(0.6)) });
      c.image('#img_photo1', 'img_photo1', 740, 740, { p: [540, 620, 0], r: kf([f(0.2), -40, E.out], [f(1.4), 0]), s: kf([f(0.2), [0, 0, 100], E.back], [f(1.1), [100, 100, 100]]) }, { masks: [maskEllipse([370, 370, 370, 370])] });
      c.text('#txt_title', { text: "Today's Menu", font: 'ElMessiri-Bold', size: 110, color: '#3B2416', justify: 'center', box: [980, 150] }, riseIn(c, f(1.1), 540, 1150));
      for (let i = 1; i <= 3; i++) {
        const t = f(1.4 + i * 0.25);
        const y = 1250 + i * 110;
        c.text(`#txt_item${i}`, { text: 'Dish — 00 AED', font: 'Cairo-Medium', size: 50, color: '#3B2416', justify: 'center', box: [960, 76] }, riseIn(c, t, 540, y, 30, 14));
      }
      c.shape('#col_primary', [rect(620, 116, { r: 58 }), fill('#D9622B')], popIn(f(2.6), 540, 1760, 14));
      c.text('#txt_cta', { text: 'Order on WhatsApp', font: 'Cairo-Bold', size: 46, justify: 'center', box: [580, 76] }, { p: [540, 1760, 0], o: fade(f(2.8)) });
      c.image('#img_logo', 'logo', 160, 160, popIn(f(1.0), 950, 120, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'special-hours',
      name: { en: 'Special Hours', ar: 'ساعات عمل خاصة' },
      category: 'food', usages: ['retail'], tags: ['hours', 'ramadan', 'opening', 'schedule'],
      pro: true, music: 'calm', publishedAt: '2026-11-03', trending: 55,
      samples: {},
      defaults: {
        en: { title: 'Special Hours', hours: 'Open 8 PM – 2 AM', subtitle: 'During the holy month' },
        ar: { title: 'ساعات عمل خاصة', hours: 'مفتوح من 8 مساءً حتى 2 صباحاً', subtitle: 'خلال الشهر الفضيل' },
      },
    },
    build() {
      const c = new Comp('Special Hours', W, H, 7);
      const f = c.f;
      c.background('#col_secondary', '#0F2A2E');
      const clock = c.nul('clock', { p: [540, 720, 0], s: kf([0, [0, 0, 100], E.back], [f(0.7), [100, 100, 100]]) });
      c.shape('#col_primary', [ellipse(560, 560), stroke('#F0C674', 22), trim(0, kf([f(0.1), 0, E.out], [f(1.1), 100]))], { r: -90 }, { parent: clock.ind });
      c.shape('ticks', [group([rect(10, 40, { p: [0, -230] }), fill('#F0C674'), repeatShape(12, [0, 0], 30)])], { o: fade(f(0.8)) }, { parent: clock.ind });
      c.shape('hour', [rect(18, 150, { p: [0, -75], r: 9 }), fill('#FFFFFF')], { r: kf([f(0.5), -120, E.out], [f(2), 60], [c.op, 75]) }, { parent: clock.ind });
      c.shape('minute', [rect(12, 210, { p: [0, -105], r: 6 }), fill('#FFFFFF')], { r: kf([f(0.5), -360, E.out], [f(2), 0], [c.op, 180]) }, { parent: clock.ind });
      c.shape('#col_primary', [ellipse(36, 36), fill('#F0C674')], {}, { parent: clock.ind });
      c.text('#txt_title', { text: 'Special Hours', font: 'ElMessiri-Bold', size: 112, justify: 'center', box: [980, 150] }, riseIn(c, f(1.1), 540, 1200));
      c.text('#txt_hours', { text: 'Open 8 PM – 2 AM', font: 'Cairo-Bold', size: 62, color: '#F0C674', justify: 'center', box: [980, 90] }, riseIn(c, f(1.4), 540, 1340));
      c.text('#txt_subtitle', { text: 'During the holy month', font: 'Cairo-Regular', size: 48, color: '#CFE3E0', justify: 'center', box: [980, 76] }, riseIn(c, f(1.7), 540, 1450));
      c.image('#img_logo', 'logo', 200, 200, popIn(f(2.1), 540, 1700, 14));
      return c;
    },
  },

  // ---------------------------------------------------------------- BEAUTY
  {
    meta: {
      id: 'salon-offer',
      name: { en: 'Salon Offer', ar: 'عرض الصالون' },
      category: 'beauty', usages: ['retail'], tags: ['salon', 'beauty', 'spa', 'offer'],
      pro: true, music: 'calm', publishedAt: '2026-11-12', trending: 70,
      samples: { photo1: 'samples/salon.jpg' },
      defaults: {
        en: { title: 'Glow Package', details: 'Facial + Hair spa', price: 'AED 299', cta: 'Book now' },
        ar: { title: 'باقة النضارة', details: 'تنظيف بشرة + حمام شعر', price: '299 درهم', cta: 'احجز الآن' },
      },
    },
    build() {
      const c = new Comp('Salon Offer', W, H, 9);
      const f = c.f;
      c.background('#col_secondary', '#F7E8E4');
      c.shape('#col_primary', [{ ty: 'sh', nm: 'arch', ks: { a: 0, k: archPath(-380, -560, 760, 1120) } }, stroke('#B76E79', 6), trim(0, kf([f(0.1), 0, E.inOut], [f(1.6), 100]))], { p: [540, 760, 0] });
      c.image('#img_photo1', 'img_photo1', 700, 1060, { ...kenBurns(f(0.4), c.op, 540, 760, 112, 100), o: fade(f(0.4), 24) }, {
        masks: [{ inv: false, mode: 'a', nm: 'arch', o: { a: 0, k: 100 }, x: { a: 0, k: 0 }, pt: { a: 0, k: archPath(0, 0, 700, 1060) } }],
      });
      c.text('#txt_title', { text: 'Glow Package', font: 'Amiri-Bold', size: 112, color: '#5A2E35', justify: 'center', box: [980, 150] }, riseIn(c, f(1.4), 540, 1420));
      c.text('#txt_details', { text: 'Facial + Hair spa', font: 'Cairo-Regular', size: 52, color: '#7A4F56', justify: 'center', box: [980, 80] }, riseIn(c, f(1.6), 540, 1530));
      c.text('#txt_price', { text: 'AED 299', font: 'Cairo-Bold', size: 76, color: '#B76E79', justify: 'center', box: [700, 100] }, popIn(f(1.9), 540, 1650, 14));
      c.shape('#col_primary', [rect(440, 104, { r: 52 }), fill('#B76E79')], popIn(f(2.3), 540, 1790, 14));
      c.text('#txt_cta', { text: 'Book now', font: 'Cairo-Bold', size: 46, justify: 'center', box: [400, 70] }, { p: [540, 1790, 0], o: fade(f(2.5)) });
      c.image('#img_logo', 'logo', 150, 150, popIn(f(2.0), 540, 110, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'beauty-before-after',
      name: { en: 'Fresh Look', ar: 'إطلالة جديدة' },
      category: 'beauty', usages: ['retail', 'creator'], tags: ['hair', 'makeup', 'look', 'fashion'],
      pro: true, music: 'golden-hour', publishedAt: '2026-11-04', trending: 63,
      samples: { photo1: 'samples/fashion2.jpg', photo2: 'samples/salon.jpg' },
      defaults: {
        en: { title: 'Fresh Look', subtitle: 'by our stylists', cta: 'Walk-ins welcome' },
        ar: { title: 'إطلالة جديدة', subtitle: 'بلمسة خبرائنا', cta: 'نستقبلكم بدون موعد' },
      },
    },
    build() {
      const c = new Comp('Fresh Look', W, H, 8);
      const f = c.f;
      c.background('#col_secondary', '#1E1B24');
      c.image('#img_photo1', 'img_photo1', 1080, 1920, kenBurns(0, f(4.3), 540, 960, 108, 100), { op: f(4.3) });
      c.image('#img_photo2', 'img_photo2', 1080, 1920, kenBurns(f(3.8), c.op, 540, 960, 100, 108), {
        ip: f(3.8), masks: [maskEllipse([[f(3.8), [540, 960, 0, 0], E.inOut], [f(4.6), [540, 960, 1200, 1200]]])],
      });
      c.shape('shade', [rect(1080, 700), gradient([[0, '#000000', 0], [1, '#000000', 0.7]], [0, -350], [0, 350])], { p: [540, 1570, 0] });
      c.shape('#col_primary', [rect(980, 980), stroke('#F5C2C7', 6), trim(0, kf([f(0.2), 0, E.inOut], [f(1.6), 100]))], { p: [540, 960, 0], r: 45, o: kf([f(3), 100, E.inOut], [f(3.6), 0]) });
      c.text('#txt_title', { text: 'Fresh Look', font: 'ReemKufi-Bold', size: 140, justify: 'center', box: [980, 180] }, riseIn(c, f(0.8), 540, 1500));
      c.text('#txt_subtitle', { text: 'by our stylists', font: 'Amiri-Regular', size: 64, color: '#F5C2C7', justify: 'center', box: [980, 90] }, riseIn(c, f(1.1), 540, 1630));
      c.text('#txt_cta', { text: 'Walk-ins welcome', font: 'Cairo-Medium', size: 42, justify: 'center', box: [980, 64], tracking: 60 }, { p: [540, 1760, 0], o: fade(f(4.8)) });
      c.image('#img_logo', 'logo', 160, 160, popIn(f(1.4), 540, 130, 14));
      return c;
    },
  },

  // ---------------------------------------------------------------- EVENTS
  {
    meta: {
      id: 'ramadan-kareem',
      name: { en: 'Ramadan Kareem', ar: 'رمضان كريم' },
      category: 'events', usages: ['personal', 'retail', 'real-estate', 'creator'], tags: ['ramadan', 'eid', 'greetings', 'seasonal'],
      pro: true, music: 'desert-groove', publishedAt: '2026-11-12', trending: 85,
      samples: {},
      defaults: {
        en: { title: 'Ramadan Kareem', subtitle: 'Wishing you a blessed month' },
        ar: { title: 'رمضان كريم', subtitle: 'نتمنى لكم شهراً مباركاً' },
      },
    },
    build() {
      const c = new Comp('Ramadan Kareem', W, H, 8);
      const f = c.f;
      c.background('#col_secondary', '#0B1D3A');
      c.shape('glow', [ellipse(900, 900), gradient([[0, '#F6D47A', 0.35], [1, '#F6D47A', 0]], [0, 0], [450, 0], 2)], { p: [540, 640, 0], o: fade(f(0.5), 30) });
      // stars
      const stars: [number, number, number, number][] = [[160, 260, 10, 0], [880, 220, 8, 0.4], [300, 520, 6, 0.8], [950, 600, 12, 0.2], [120, 900, 7, 1.0], [780, 980, 6, 0.6], [470, 180, 9, 1.2], [1000, 1250, 7, 0.9], [90, 1400, 9, 0.3]];
      for (const [x, y, r, d] of stars) {
        const t = f(d);
        c.shape('star', [ellipse(r * 2, r * 2), fill('#FFF6D8')], { p: [x, y, 0], o: kf([t, 0, E.sine], [t + 20, 100, E.sine], [t + 50, 30, E.sine], [t + 80, 100, E.sine], [t + 120, 40]) });
      }
      // crescent: big circle minus offset circle (drawn with background color)
      const moon = c.nul('moon', { p: kf([0, [540, 760, 0], E.out], [f(1.4), [540, 640, 0]]), r: -20, o: fade(0, 20) });
      c.shape('#col_primary', [ellipse(440, 440), fill('#F6D47A')], {}, { parent: moon.ind });
      c.shape('#col_secondary', [ellipse(400, 400, [110, -60]), fill('#0B1D3A')], {}, { parent: moon.ind });
      // lanterns
      const lantern = (x: number, len: number, delay: number) => {
        const l = c.nul('lantern', { p: [x, -10, 0], r: kf([f(delay), -6, E.sine], [f(delay + 1.6), 6, E.sine], [f(delay + 3.2), -6, E.sine], [f(delay + 4.8), 6, E.sine], [f(delay + 6.4), -6]) });
        c.shape('string', [path([[0, 0], [0, len]], false), stroke('#F6D47A', 4)], {}, { parent: l.ind });
        c.shape('#col_primary', [
          group([path([[-50, 0], [50, 0], [70, 120], [0, 170], [-70, 120]]), fill('#F6D47A')], { p: [0, len] }),
          group([rect(40, 30, { r: 6 }), fill('#F6D47A')], { p: [0, len - 10] }),
        ], {}, { parent: l.ind });
        c.shape('light', [ellipse(50, 70), fill('#FFFBEA', 90)], { p: [0, len + 80, 0], o: kf([0, 60, E.sine], [f(1), 100, E.sine], [f(2), 60, E.sine], [f(3), 100, E.sine], [f(4), 60]) }, { parent: l.ind });
      };
      lantern(200, 260, 0);
      lantern(880, 380, 0.5);
      c.text('#txt_title', { text: 'Ramadan Kareem', font: 'ReemKufi-Bold', size: 140, color: '#F6D47A', justify: 'center', box: [1000, 190] }, riseIn(c, f(1.2), 540, 1180));
      c.text('#txt_subtitle', { text: 'Wishing you a blessed month', font: 'Amiri-Regular', size: 62, color: '#E8EDF5', justify: 'center', box: [980, 140] }, riseIn(c, f(1.6), 540, 1340));
      c.image('#img_logo', 'logo', 200, 200, popIn(f(2.2), 540, 1680, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'uae-national-day',
      name: { en: 'UAE National Day', ar: 'اليوم الوطني الإماراتي' },
      category: 'events', usages: ['personal', 'retail', 'real-estate', 'creator'], tags: ['national day', 'uae', '2 december', 'seasonal', 'flag'],
      pro: true, music: 'pop-promo', publishedAt: '2026-11-13', trending: 92,
      samples: {},
      defaults: {
        en: { title: 'Happy National Day', subtitle: '2 December', brand: 'From all of us' },
        ar: { title: 'عيد اتحاد سعيد', subtitle: '2 ديسمبر', brand: 'من أسرتنا إليكم' },
      },
    },
    build() {
      const c = new Comp('UAE National Day', W, H, 8);
      const f = c.f;
      c.background('bg', '#FFFFFF');
      // flag stripes wipe in (official colors — intentionally not editable)
      const stripes: [string, number][] = [['#00732F', 0], ['#FFFFFF', 1], ['#000000', 2]];
      for (const [hex, i] of stripes) {
        const y = 640 + i * 213;
        c.shape('stripe', [rect(1080, 214, { p: [540, 0] }), fill(hex)], { p: [0, y, 0], s: kf([f(0.2 + i * 0.15), [0, 100, 100], E.out], [f(1 + i * 0.15), [100, 100, 100]]) });
      }
      c.shape('red', [rect(300, 640, { p: [150, 0] }), fill('#FF0000')], { p: [0, 853, 0], s: kf([f(0.1), [0, 100, 100], E.out], [f(0.8), [100, 100, 100]]) });
      // confetti
      const colors = ['#00732F', '#FF0000', '#000000', '#C9A227'];
      for (let i = 0; i < 18; i++) {
        const x = 60 + ((i * 197) % 960);
        const t = f(1.2 + (i % 6) * 0.15);
        c.shape('confetti', [rect(18, 34, { r: 4 }), fill(colors[i % 4])], {
          p: kf([t, [x, -60, 0], E.linear], [t + f(3.6), [x + ((i % 3) - 1) * 120, 1960, 0]]),
          r: kf([t, 0, E.linear], [t + f(3.6), 360 * ((i % 2) * 2 - 1)]),
        });
      }
      c.text('#txt_title', { text: 'Happy National Day', font: 'ReemKufi-Bold', size: 120, color: '#0B0B0B', justify: 'center', box: [1000, 300], lineHeight: 1.1 }, riseIn(c, f(1.3), 540, 340));
      c.text('#txt_subtitle', { text: '2 December', font: 'Cairo-Bold', size: 70, color: '#00732F', justify: 'center', box: [900, 100] }, riseIn(c, f(1.6), 540, 1640));
      c.text('#txt_brand', { text: 'From all of us', font: 'Cairo-Regular', size: 46, color: '#333333', justify: 'center', box: [900, 70] }, riseIn(c, f(1.9), 540, 1750));
      c.image('#img_logo', 'logo', 150, 150, popIn(f(2.2), 540, 1500, 14));
      return c;
    },
  },
  {
    meta: {
      id: 'invitation',
      name: { en: "You're Invited", ar: 'أنتم مدعوون' },
      category: 'events', usages: ['personal'], tags: ['wedding', 'invitation', 'birthday', 'party', 'post'],
      pro: true, music: 'calm', publishedAt: '2026-10-28', trending: 58,
      samples: {},
      defaults: {
        en: { title: "You're invited", name: 'Sara & Omar', date: 'Saturday, 12 December 2026', place: 'Jumeirah Beach Hotel, Dubai' },
        ar: { title: 'أنتم مدعوون', name: 'سارة وعمر', date: 'السبت، 12 ديسمبر 2026', place: 'فندق جميرا بيتش، دبي' },
      },
    },
    build() {
      const c = new Comp('Invitation', 1080, 1350, 10);
      const f = c.f;
      c.background('#col_secondary', '#FBF7F0');
      c.shape('#col_primary', [rect(940, 1210, { r: 8 }), stroke('#B08D57', 4), trim(0, kf([0, 0, E.inOut], [f(1.6), 100]))], { p: [540, 675, 0] });
      c.shape('#col_primary', [rect(900, 1170, { r: 4 }), stroke('#B08D57', 2), trim(0, kf([f(0.3), 0, E.inOut], [f(1.9), 100]))], { p: [540, 675, 0] });
      const orn = (y: number, t: number) => c.shape('#col_primary', [
        path([[-160, 0], [-30, 0]], false), path([[30, 0], [160, 0]], false), stroke('#B08D57', 3),
        group([rect(22, 22), fill('#B08D57')], { r: 45 }),
      ], { p: [540, y, 0], s: kf([t, [0, 100, 100], E.out], [t + 20, [100, 100, 100]]) });
      orn(250, f(1.0));
      c.text('#txt_title', { text: "You're invited", font: 'Amiri-Regular', size: 70, color: '#6B5B45', justify: 'center', box: [860, 100] }, riseIn(c, f(1.1), 540, 360, 40));
      c.text('#txt_name', { text: 'Sara & Omar', font: 'ElMessiri-Bold', size: 130, color: '#3A2F23', justify: 'center', box: [880, 330], lineHeight: 1.15 }, riseIn(c, f(1.4), 540, 610, 50));
      orn(830, f(1.8));
      c.text('#txt_date', { text: 'Saturday, 12 December 2026', font: 'Cairo-Medium', size: 46, color: '#3A2F23', justify: 'center', box: [860, 70] }, riseIn(c, f(2.0), 540, 940, 30));
      c.text('#txt_place', { text: 'Jumeirah Beach Hotel, Dubai', font: 'Cairo-Regular', size: 40, color: '#6B5B45', justify: 'center', box: [860, 120] }, riseIn(c, f(2.2), 540, 1050, 30));
      return c;
    },
  },

  // ---------------------------------------------------------------- TEXTS & QUOTES
  {
    meta: {
      id: 'quote-card',
      name: { en: 'Quote Card', ar: 'بطاقة اقتباس' },
      category: 'quotes', usages: ['creator', 'personal', 'retail'], tags: ['quote', 'text', 'motivation', 'square'],
      pro: false, music: 'calm', publishedAt: '2026-11-05', trending: 66,
      samples: {},
      defaults: {
        en: { quote: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
        ar: { quote: 'الجودة ليست فعلاً، بل عادة.', author: 'أرسطو' },
      },
    },
    build() {
      const c = new Comp('Quote Card', 1080, 1080, 8);
      const f = c.f;
      c.background('#col_secondary', '#14213D');
      c.shape('#col_primary', [ellipse(700, 700), fill('#FCA311', 12)], { p: [880, 200, 0], s: kf([0, [0, 0, 100], E.out], [f(1.2), [100, 100, 100]]) });
      const q = (x: number) => group([ellipse(46, 46, [0, 0]), path([[-23, 0], [-23, 0], [10, 60], [23, 0]]), fill('#FCA311')], { p: [x, 0] });
      c.shape('#col_primary', [q(-36), q(36)], popIn(f(0.3), 540, 230, 16));
      c.text('#txt_quote', { text: 'Quality is not an act, it is a habit.', font: 'Amiri-Bold', size: 84, justify: 'center', box: [900, 420], lineHeight: 1.3 }, {
        p: [540, 560, 0], o: fade(f(0.7), 20),
      }, { masks: [maskRect([[f(0.7), [-450, -210, 900, 0], E.inOut], [f(1.7), [-450, -210, 900, 420]]])] });
      c.shape('#col_primary', [rect(120, 6), fill('#FCA311')], { p: [540, 840, 0], s: kf([f(1.7), [0, 100, 100], E.out], [f(2.2), [100, 100, 100]]) });
      c.text('#txt_author', { text: 'Aristotle', font: 'Cairo-Medium', size: 46, color: '#E5E5E5', justify: 'center', box: [800, 70], tracking: 60 }, riseIn(c, f(1.9), 540, 920, 30));
      return c;
    },
  },
  {
    meta: {
      id: 'link-in-bio',
      name: { en: 'Link in Bio', ar: 'الرابط في البايو' },
      category: 'quotes', usages: ['creator', 'retail'], tags: ['link', 'bio', 'creator', 'cta', 'story'],
      pro: true, music: 'pop-promo', publishedAt: '2026-11-13', trending: 74,
      samples: {},
      defaults: {
        en: { title: 'Link in bio', subtitle: 'Tap to discover more' },
        ar: { title: 'الرابط في البايو', subtitle: 'اضغط لاكتشاف المزيد' },
      },
    },
    build() {
      const c = new Comp('Link in Bio', W, H, 6);
      const f = c.f;
      c.background('#col_secondary', '#6C2BD9');
      c.shape('blob', [ellipse(1200, 1200), fill('#FFFFFF', 8)], { p: kf([0, [200, 400, 0], E.sine], [f(3), [300, 520, 0], E.sine], [c.op, [200, 400, 0]]) });
      c.shape('blob', [ellipse(900, 900), fill('#FFFFFF', 8)], { p: kf([0, [900, 1500, 0], E.sine], [f(3), [800, 1400, 0], E.sine], [c.op, [900, 1500, 0]]) });
      c.shape('#col_primary', [rect(860, 220, { r: 110 }), fill('#FFE14D')], popIn(f(0.3), 540, 860, 18));
      c.text('#txt_title', { text: 'Link in bio', font: 'Cairo-ExtraBold', size: 104, color: '#1A1033', justify: 'center', box: [800, 140] }, popIn(f(0.45), 540, 860, 18));
      c.text('#txt_subtitle', { text: 'Tap to discover more', font: 'Cairo-Medium', size: 56, justify: 'center', box: [900, 90] }, riseIn(c, f(0.9), 540, 1040));
      const bounce = (t: number) => kf([t, [540, 1260, 0], E.inOut], [t + 15, [540, 1320, 0], E.inOut], [t + 30, [540, 1260, 0]]);
      c.shape('arrow', [path([[-70, -40], [0, 30], [70, -40]], false), stroke('#FFFFFF', 18), trim(0, kf([f(1.1), 0, E.out], [f(1.5), 100]))], { p: { a: 1, k: [...bounce(f(1.5)).k.slice(0, 2), ...bounce(f(2.5)).k.slice(0, 2), ...bounce(f(3.5)).k.slice(0, 2), ...bounce(f(4.5)).k] } });
      c.image('#img_logo', 'logo', 200, 200, popIn(f(1.2), 540, 1560, 14));
      return c;
    },
  },
];
