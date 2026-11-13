/**
 * On-device video export — no render server, ~zero cost per video.
 * The animation is drawn frame by frame (30 fps) with lottie's canvas renderer,
 * the watermark is added on free exports, the music is mixed in, and everything
 * is encoded to MP4 (H.264 + AAC) with WebCodecs + mp4-muxer.
 * Fallback for browsers without WebCodecs: real-time MediaRecorder capture.
 */
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light_canvas';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { LottieAnimation, TemplateManifest } from '../engine/types';
import { APP_NAME } from '../services/config';
import { fitToDuration } from './music';

export type Quality = '720p' | '1080p' | '4k';

export const QUALITY_SHORT_SIDE: Record<Quality, number> = { '720p': 720, '1080p': 1080, '4k': 2160 };

export function exportSize(m: Pick<TemplateManifest, 'width' | 'height'>, q: Quality) {
  const short = QUALITY_SHORT_SIDE[q];
  const s = short / Math.min(m.width, m.height);
  const even = (v: number) => Math.round(v / 2) * 2;
  return { width: even(m.width * s), height: even(m.height * s) };
}

/** Scale for the replaceable images, relative to the composition (1080 comp → 2 for 4K). */
export function assetScale(m: Pick<TemplateManifest, 'width' | 'height'>, q: Quality) {
  return Math.max(1, QUALITY_SHORT_SIDE[q] / Math.min(m.width, m.height));
}

export interface ExportResult {
  blob: Blob;
  mime: string;
  ext: 'mp4' | 'webm';
  width: number;
  height: number;
  ms: number;
}

export interface ExportOptions {
  manifest: TemplateManifest;
  animation: LottieAnimation;
  quality: Quality;
  watermark: boolean;
  audio: AudioBuffer | null;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

// ---- capability detection -----------------------------------------------------

const AVC_CODECS = (w: number, h: number) => {
  const px = w * h;
  // High profile; level chosen from the frame size
  if (px > 2228224) return ['avc1.640033', 'avc1.640034', 'avc1.4d0033'];
  if (px > 921600) return ['avc1.640028', 'avc1.640029', 'avc1.4d0028', 'avc1.42e028'];
  return ['avc1.64001f', 'avc1.4d001f', 'avc1.42e01f'];
};

async function pickVideoCodec(width: number, height: number): Promise<{ codec: string; mux: 'avc' | 'hevc' | 'vp9' | 'av1' } | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const tries: [string, 'avc' | 'hevc' | 'vp9' | 'av1'][] = [
    ...AVC_CODECS(width, height).map((c) => [c, 'avc'] as [string, 'avc']),
    ['hvc1.1.6.L153.B0', 'hevc'],
    ['vp09.00.40.08', 'vp9'],
    ['av01.0.08M.08', 'av1'],
  ];
  for (const [codec, mux] of tries) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: bitrateFor(width, height), framerate: 30 });
      if (r.supported) return { codec, mux };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function pickAudioCodec(sampleRate: number): Promise<{ codec: string; mux: 'aac' | 'opus' } | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  const tries: [string, 'aac' | 'opus'][] = [['mp4a.40.2', 'aac'], ['opus', 'opus']];
  for (const [codec, mux] of tries) {
    try {
      const r = await AudioEncoder.isConfigSupported({ codec, sampleRate, numberOfChannels: 2, bitrate: 160_000 });
      if (r.supported) return { codec, mux };
    } catch {
      /* next */
    }
  }
  return null;
}

const bitrateFor = (w: number, h: number) => Math.round(Math.min(40_000_000, Math.max(4_000_000, w * h * 30 * 0.12)));

/** 4K needs a recent device: we check the encoder supports it before offering it. */
export async function canExport4k(m: TemplateManifest) {
  const { width, height } = exportSize(m, '4k');
  if (typeof VideoEncoder === 'undefined') return false;
  const c = await pickVideoCodec(width, height);
  return !!c;
}

// ---- rendering ------------------------------------------------------------------

async function loadFrameRenderer(animation: LottieAnimation, width: number, height: number) {
  // The container gets its final pixel size BEFORE loading: resizing the canvas afterwards
  // resets the 2D context state (line widths…) that lottie-web 5.12 keeps cached.
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
  document.body.appendChild(container);
  const anim: AnimationItem = lottie.loadAnimation({
    container,
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: structuredClone(animation), // lottie mutates the data it loads
    rendererSettings: { clearCanvas: true, preserveAspectRatio: 'xMidYMid meet', dpr: 1 } as any,
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Animation failed to load')), 20000);
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      if ((anim as any).isLoaded) done();
      else anim.addEventListener('DOMLoaded', done);
    });
  } catch (e) {
    anim.destroy();
    container.remove();
    throw e;
  }
  const work = container.querySelector('canvas')!;
  const destroy = () => {
    anim.destroy();
    container.remove();
  };
  return { anim, work, destroy };
}

export function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const s = Math.min(width, height) / 1080;
  const text = `Made with ${APP_NAME}`;
  ctx.save();
  ctx.font = `700 ${Math.round(34 * s)}px Cairo, system-ui, sans-serif`;
  ctx.direction = 'ltr';
  const tw = ctx.measureText(text).width;
  const padX = 26 * s;
  const h = 64 * s;
  const iconW = 40 * s;
  const w = tw + padX * 2 + iconW;
  const x = width - w - 32 * s;
  const y = height - h - 40 * s;
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  (ctx as any).roundRect ? (ctx as any).roundRect(x, y, w, h, h / 2) : ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.globalAlpha = 1;
  // play glyph
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  const gx = x + padX;
  const gy = y + h / 2;
  ctx.moveTo(gx, gy - 14 * s);
  ctx.lineTo(gx + 24 * s, gy);
  ctx.lineTo(gx, gy + 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, gx + iconW, gy + 2 * s);
  ctx.restore();
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

// ---- WebCodecs path ---------------------------------------------------------------

export async function exportVideo(opts: ExportOptions): Promise<ExportResult> {
  const started = performance.now();
  const { manifest, quality } = opts;
  const { width, height } = exportSize(manifest, quality);
  const video = await pickVideoCodec(width, height);
  if (!video) return exportWithMediaRecorder(opts, width, height, started);

  const fps = manifest.fps || 30;
  const frames = manifest.frames;
  const duration = frames / fps;
  const sampleRate = 48000;
  const audioBuf = opts.audio ? await fitToDuration(opts.audio, duration, sampleRate) : null;
  const audio = audioBuf ? await pickAudioCodec(sampleRate) : null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: video.mux, width, height, frameRate: fps },
    ...(audio ? { audio: { codec: audio.mux, numberOfChannels: 2, sampleRate } } : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encodeError: any = null;
  const venc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encodeError = e),
  });
  venc.configure({
    codec: video.codec,
    width,
    height,
    bitrate: bitrateFor(width, height),
    framerate: fps,
    latencyMode: 'quality',
    ...(video.mux === 'avc' ? { avc: { format: 'avc' } } : {}),
  } as VideoEncoderConfig);

  const { anim, work, destroy } = await loadFrameRenderer(opts.animation, width, height);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d', { alpha: false })!;

  try {
    for (let i = 0; i < frames; i++) {
      checkAbort(opts.signal);
      if (encodeError) throw encodeError;
      anim.goToAndStop(i, true);
      octx.fillStyle = '#000';
      octx.fillRect(0, 0, width, height);
      octx.drawImage(work, 0, 0);
      if (opts.watermark) drawWatermark(octx, width, height);
      const frame = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      venc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      // back-pressure: keep memory low on phones
      while (venc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2));
      if (i % 3 === 0) {
        opts.onProgress?.((i / frames) * (audio ? 0.92 : 0.98));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await venc.flush();
    if (encodeError) throw encodeError;

    if (audio && audioBuf) {
      const aenc = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => (encodeError = e),
      });
      aenc.configure({ codec: audio.codec, sampleRate, numberOfChannels: 2, bitrate: 160_000 });
      const block = 1024;
      const L = audioBuf.getChannelData(0);
      const R = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : L;
      for (let pos = 0; pos < audioBuf.length; pos += block) {
        checkAbort(opts.signal);
        const n = Math.min(block, audioBuf.length - pos);
        const planar = new Float32Array(n * 2);
        planar.set(L.subarray(pos, pos + n), 0);
        planar.set(R.subarray(pos, pos + n), n);
        const data = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: n,
          numberOfChannels: 2,
          timestamp: Math.round((pos / sampleRate) * 1e6),
          data: planar,
        });
        aenc.encode(data);
        data.close();
      }
      await aenc.flush();
      aenc.close();
      if (encodeError) throw encodeError;
    }

    muxer.finalize();
    opts.onProgress?.(1);
    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    return { blob, mime: 'video/mp4', ext: 'mp4', width, height, ms: performance.now() - started };
  } finally {
    try {
      venc.close();
    } catch {
      /* closed */
    }
    destroy();
  }
}

// ---- MediaRecorder fallback (real-time) -------------------------------------------

async function exportWithMediaRecorder(opts: ExportOptions, width: number, height: number, started: number): Promise<ExportResult> {
  if (typeof MediaRecorder === 'undefined') throw new Error('Video export is not supported on this browser.');
  const fps = opts.manifest.fps || 30;
  const frames = opts.manifest.frames;
  const duration = frames / fps;
  const { anim, work, destroy } = await loadFrameRenderer(opts.animation, width, height);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d')!;
  const stream = out.captureStream(fps);

  let actx: AudioContext | null = null;
  if (opts.audio) {
    actx = new AudioContext();
    const dest = actx.createMediaStreamDestination();
    const src = actx.createBufferSource();
    src.buffer = await fitToDuration(opts.audio, duration, actx.sampleRate);
    src.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    src.start();
  }
  const mime = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: bitrateFor(width, height) });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start(250);
  const t0 = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (opts.signal?.aborted) return reject(new DOMException('Export cancelled', 'AbortError'));
      const t = (performance.now() - t0) / 1000;
      const i = Math.min(frames - 1, Math.floor(t * fps));
      anim.goToAndStop(i, true);
      octx.fillStyle = '#000';
      octx.fillRect(0, 0, width, height);
      octx.drawImage(work, 0, 0);
      if (opts.watermark) drawWatermark(octx, width, height);
      opts.onProgress?.(t / duration);
      if (t >= duration) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  await stopped;
  destroy();
  actx?.close();
  const type = rec.mimeType || mime || 'video/webm';
  const ext = type.includes('mp4') ? 'mp4' : 'webm';
  return { blob: new Blob(chunks, { type }), mime: type, ext, width, height, ms: performance.now() - started };
}

/** Small JPEG of one frame (project thumbnails). */
export async function snapshot(animation: LottieAnimation, m: TemplateManifest, width: number, at = 0.65): Promise<string> {
  const height = Math.round((width * m.height) / m.width);
  const { anim, work, destroy } = await loadFrameRenderer(animation, width, height);
  try {
    anim.goToAndStop(Math.floor(m.frames * at), true);
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(work, 0, 0);
    return out.toDataURL('image/jpeg', 0.8);
  } finally {
    destroy();
  }
}
