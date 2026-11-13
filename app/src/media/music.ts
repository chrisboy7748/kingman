/**
 * Music library.
 * The demo tracks are synthesised in the browser (OfflineAudioContext), so they are
 * 100% royalty-free and weigh 0 bytes. In production, replace them with a licensed
 * royalty-free library (licence valid for use inside an app) by adding `url` entries.
 */

export interface Track {
  id: string;
  name: { en: string; ar: string };
  mood: { en: string; ar: string };
  bpm: number;
  pro: boolean;
  /** optional licensed file; when absent the track is synthesised */
  url?: string;
}

export const TRACKS: Track[] = [
  { id: 'golden-hour', name: { en: 'Golden Hour', ar: 'الساعة الذهبية' }, mood: { en: 'Warm house', ar: 'هاوس دافئ' }, bpm: 118, pro: false },
  { id: 'calm', name: { en: 'Soft Breeze', ar: 'نسيم هادئ' }, mood: { en: 'Calm ambient', ar: 'هادئ' }, bpm: 70, pro: false },
  { id: 'luxe', name: { en: 'Marina Luxe', ar: 'مارينا الفاخرة' }, mood: { en: 'Elegant piano', ar: 'بيانو أنيق' }, bpm: 84, pro: true },
  { id: 'desert-groove', name: { en: 'Desert Groove', ar: 'إيقاع الصحراء' }, mood: { en: 'Oriental percussion', ar: 'إيقاع شرقي' }, bpm: 100, pro: true },
  { id: 'pop-promo', name: { en: 'Flash Sale', ar: 'عرض سريع' }, mood: { en: 'Energetic pop', ar: 'بوب حماسي' }, bpm: 126, pro: true },
];

export const trackById = (id: string | null | undefined) => TRACKS.find((t) => t.id === id);

const SR = 44100;
const LENGTH = 16; // seconds — longest template is 15 s

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type Ctx = OfflineAudioContext;

function noiseBuffer(ctx: Ctx, seconds = 1) {
  const b = ctx.createBuffer(1, Math.floor(SR * seconds), SR);
  const d = b.getChannelData(0);
  let seed = 1234567;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return b;
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(
  ctx: Ctx, out: AudioNode, t: number, freq: number, dur: number,
  o: { type?: OscillatorType; gain?: number; attack?: number; detune?: number; cutoff?: number; pan?: number } = {},
) {
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.value = freq;
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  env(g, t, o.gain ?? 0.2, o.attack ?? 0.01, dur);
  let node: AudioNode = osc;
  if (o.cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.cutoff;
    node.connect(f);
    node = f;
  }
  node.connect(g);
  if (o.pan) {
    const p = ctx.createStereoPanner();
    p.pan.value = o.pan;
    g.connect(p);
    p.connect(out);
  } else g.connect(out);
  osc.start(t);
  osc.stop(t + (o.attack ?? 0.01) + dur + 0.05);
}

function kick(ctx: Ctx, out: AudioNode, t: number, gain = 0.9) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  const g = ctx.createGain();
  env(g, t, gain, 0.003, 0.32);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.4);
}

function noiseHit(ctx: Ctx, out: AudioNode, noise: AudioBuffer, t: number, type: BiquadFilterType, freq: number, decay: number, gain: number, q = 1) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, gain, 0.002, decay);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + decay + 0.05);
}

function reverb(ctx: Ctx, seconds = 2.2) {
  const conv = ctx.createConvolver();
  const len = Math.floor(SR * seconds);
  const b = ctx.createBuffer(2, len, SR);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  conv.buffer = b;
  return conv;
}

type Composer = (ctx: Ctx, bus: AudioNode, wet: AudioNode, noise: AudioBuffer) => void;

const COMPOSERS: Record<string, Composer> = {
  'golden-hour': (ctx, bus, wet, noise) => {
    const beat = 60 / 118;
    const chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]; // Am7 Fmaj7 Cmaj7 G7
    for (let b = 0; b * beat < LENGTH; b++) {
      const t = b * beat;
      kick(ctx, bus, t, 0.8);
      noiseHit(ctx, bus, noise, t + beat / 2, 'highpass', 8000, 0.05, 0.12);
      if (b % 2 === 1) noiseHit(ctx, bus, noise, t, 'bandpass', 1800, 0.16, 0.25, 0.8);
      const ch = chords[Math.floor(b / 4) % 4];
      if (b % 4 === 0) for (const n of ch) tone(ctx, wet, t, midi(n), beat * 3.6, { type: 'sawtooth', gain: 0.035, attack: 0.25, cutoff: 1400, detune: (n % 3) * 6 });
      tone(ctx, bus, t + beat / 2, midi(ch[0] - 12), beat * 0.4, { type: 'triangle', gain: 0.32 });
      if (b % 2 === 0) tone(ctx, wet, t + beat * 0.75, midi(ch[(b / 2) % 4] + 12), 0.25, { type: 'triangle', gain: 0.07, pan: b % 4 ? 0.4 : -0.4 });
    }
  },
  calm: (ctx, _bus, wet) => {
    const beat = 60 / 70;
    const chords = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];
    for (let bar = 0; bar * beat * 4 < LENGTH; bar++) {
      const t = bar * beat * 4;
      for (const n of chords[bar % 4]) tone(ctx, wet, t, midi(n), beat * 4.5, { type: 'sine', gain: 0.06, attack: 1.2 });
      for (let i = 0; i < 8; i++) {
        const n = chords[bar % 4][(i * 3) % 4] + 12 + (i % 2 ? 12 : 0);
        tone(ctx, wet, t + i * beat * 0.5, midi(n), 0.9, { type: 'triangle', gain: 0.045, pan: i % 2 ? 0.5 : -0.5 });
      }
    }
  },
  luxe: (ctx, bus, wet, noise) => {
    const beat = 60 / 84;
    const chords = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62], [40, 47, 52, 56, 59]];
    for (let b = 0; b * beat < LENGTH; b++) {
      const t = b * beat;
      const ch = chords[Math.floor(b / 4) % 4];
      if (b % 4 === 0) tone(ctx, bus, t, midi(ch[0] - 12), beat * 3.5, { type: 'sine', gain: 0.3, attack: 0.02 });
      // piano-like arpeggio
      for (let i = 0; i < 2; i++) {
        const n = ch[1 + ((b * 2 + i) % 4)];
        tone(ctx, wet, t + i * beat / 2, midi(n + 12), 1.4, { type: 'triangle', gain: 0.09, attack: 0.004 });
        tone(ctx, wet, t + i * beat / 2, midi(n + 24), 0.6, { type: 'sine', gain: 0.03, attack: 0.004 });
      }
      if (b >= 4) {
        if (b % 2 === 0) kick(ctx, bus, t, 0.5);
        noiseHit(ctx, bus, noise, t + beat / 2, 'highpass', 9000, 0.04, 0.07);
        if (b % 4 === 2) noiseHit(ctx, wet, noise, t, 'bandpass', 2500, 0.2, 0.12, 0.6);
      }
    }
  },
  'desert-groove': (ctx, bus, wet, noise) => {
    const beat = 60 / 100;
    // Hijaz on D: D Eb F# G A Bb C D
    const scale = [62, 63, 66, 67, 69, 70, 72, 74];
    const melody = [0, 1, 2, 1, 3, 2, 1, 0, 4, 3, 2, 3, 1, 2, 1, 0];
    // Maqsoum rhythm: D T - T D - T -
    const pattern = ['D', 'T', '', 'T', 'D', '', 'T', ''];
    for (let s = 0; s * beat / 2 < LENGTH; s++) {
      const t = (s * beat) / 2;
      const p = pattern[s % 8];
      if (p === 'D') {
        tone(ctx, bus, t, 95, 0.35, { type: 'sine', gain: 0.6 });
        kick(ctx, bus, t, 0.4);
      }
      if (p === 'T') noiseHit(ctx, bus, noise, t, 'bandpass', 3200, 0.08, 0.35, 2);
      if (s % 2 === 1) noiseHit(ctx, bus, noise, t, 'highpass', 7000, 0.03, 0.06);
      if (s % 2 === 0 && s >= 8) {
        const n = scale[melody[(s / 2) % 16]];
        tone(ctx, wet, t, midi(n), beat * 0.9, { type: 'sawtooth', gain: 0.05, attack: 0.02, cutoff: 2200 });
        tone(ctx, wet, t, midi(n + 12), beat * 0.5, { type: 'triangle', gain: 0.03, attack: 0.01 });
      }
      if (s % 8 === 0) tone(ctx, bus, t, midi(38), beat * 3.8, { type: 'triangle', gain: 0.25, attack: 0.05 });
    }
  },
  'pop-promo': (ctx, bus, wet, noise) => {
    const beat = 60 / 126;
    const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
    for (let b = 0; b * beat < LENGTH; b++) {
      const t = b * beat;
      kick(ctx, bus, t, 0.9);
      if (b % 2 === 1) noiseHit(ctx, bus, noise, t, 'bandpass', 1500, 0.2, 0.4, 0.7);
      for (let i = 0; i < 2; i++) noiseHit(ctx, bus, noise, t + i * beat / 2 + beat / 4, 'highpass', 9000, 0.04, 0.09);
      const ch = chords[Math.floor(b / 4) % 4];
      tone(ctx, bus, t + beat / 2, midi(ch[0] - 24), beat * 0.45, { type: 'sawtooth', gain: 0.14, cutoff: 600 });
      for (let i = 0; i < 4; i++) {
        const n = ch[i % 3] + 12;
        tone(ctx, wet, t + i * beat / 4, midi(n), 0.12, { type: 'square', gain: 0.035, cutoff: 3000, pan: i % 2 ? 0.3 : -0.3 });
      }
    }
  },
};

const rendered = new Map<string, Promise<AudioBuffer>>();

export function renderTrack(id: string): Promise<AudioBuffer> {
  let p = rendered.get(id);
  if (!p) {
    p = (async () => {
      const track = trackById(id);
      if (track?.url) {
        const res = await fetch(track.url);
        return decodeAudio(await res.arrayBuffer());
      }
      const ctx = new OfflineAudioContext(2, SR * LENGTH, SR);
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      const master = ctx.createGain();
      master.gain.value = 0.9;
      comp.connect(master).connect(ctx.destination);
      const bus = ctx.createGain();
      bus.connect(comp);
      const verb = reverb(ctx);
      const wet = ctx.createGain();
      const dry = ctx.createGain();
      wet.connect(verb);
      wet.connect(dry);
      dry.gain.value = 0.8;
      dry.connect(comp);
      const verbGain = ctx.createGain();
      verbGain.gain.value = 0.35;
      verb.connect(verbGain).connect(comp);
      (COMPOSERS[id] || COMPOSERS['golden-hour'])(ctx, bus, wet, noiseBuffer(ctx));
      return ctx.startRendering();
    })();
    rendered.set(id, p);
    p.catch(() => rendered.delete(id));
  }
  return p;
}

let decodeCtx: AudioContext | null = null;
export async function decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
  decodeCtx = decodeCtx || new AudioContext();
  return decodeCtx.decodeAudioData(data);
}

/** Cuts a buffer to the template duration, with a short fade in / fade out. */
export function fitToDuration(buf: AudioBuffer, seconds: number, sampleRate = 48000): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = buf.duration < seconds;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(1, 0.05);
  g.gain.setValueAtTime(1, Math.max(0.1, seconds - 0.8));
  g.gain.linearRampToValueAtTime(0, seconds);
  src.connect(g).connect(ctx.destination);
  src.start(0);
  return ctx.startRendering();
}

// ---- preview player ----------------------------------------------------------

class Preview {
  private ctx: AudioContext | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;

  /** Must be called from a user gesture on iOS. */
  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(buf: AudioBuffer, offset = 0, loopDuration?: number) {
    this.stop();
    this.unlock();
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (loopDuration) {
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = Math.min(loopDuration, buf.duration);
    }
    const g = ctx.createGain();
    g.gain.value = 0.9;
    src.connect(g).connect(ctx.destination);
    src.start(0, Math.min(offset, buf.duration - 0.01));
    this.src = src;
    this.gain = g;
  }

  stop() {
    try {
      this.src?.stop();
    } catch {
      /* already stopped */
    }
    this.src?.disconnect();
    this.gain?.disconnect();
    this.src = null;
  }

  get playing() {
    return !!this.src;
  }
}

export const audioPreview = new Preview();
