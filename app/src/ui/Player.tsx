import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light_canvas';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { applyContent } from '../engine/apply';
import { browserRenderers } from '../engine/render';
import type { LottieAnimation, TemplateContent, TemplateManifest } from '../engine/types';
import { loadTemplate } from '../services/catalog';

export interface PlayerHandle {
  anim: AnimationItem | null;
  restart(): void;
}

interface Props {
  animation: LottieAnimation | null;
  aspect: number; // width / height
  playing?: boolean;
  /** play only while on screen (catalog cards) */
  autoPause?: boolean;
  /** lower device pixel ratio for small previews */
  dpr?: number;
  className?: string;
  onLoop?: () => void;
  watermark?: boolean;
  /** frame shown before playback starts, as a ratio of the duration (catalog cards) */
  poster?: number;
  children?: React.ReactNode;
}

/** Plays a Lottie animation with the canvas renderer (same renderer as the export). */
export const Player = forwardRef<PlayerHandle, Props>(function Player(
  { animation, aspect, playing = true, autoPause = false, dpr, className, onLoop, watermark, poster = 0, children },
  ref,
) {
  const box = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [visible, setVisible] = useState(!autoPause);
  const onLoopRef = useRef(onLoop);
  onLoopRef.current = onLoop;

  useImperativeHandle(ref, () => ({
    get anim() {
      return animRef.current;
    },
    restart() {
      animRef.current?.goToAndPlay(0, true);
    },
  }));

  // visibility
  useEffect(() => {
    if (!autoPause || !box.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, [autoPause]);

  // (re)create the animation; keep the current frame so editing does not restart the preview.
  // The old canvas stays visible until the new one is ready → no flicker while typing.
  const layers = useRef(new Map<AnimationItem, HTMLDivElement>());
  useEffect(() => {
    if (!animation || !box.current) return;
    const frame = animRef.current ? animRef.current.currentFrame : -1;
    const container = document.createElement('div');
    container.className = 'player-layer';
    box.current.appendChild(container);
    const a = lottie.loadAnimation({
      container,
      renderer: 'canvas',
      loop: true,
      autoplay: false,
      animationData: structuredClone(animation), // lottie mutates the data it loads
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: true, dpr: dpr ?? Math.min(2, window.devicePixelRatio || 1) } as any,
    });
    layers.current.set(a, container);
    animRef.current = a;
    a.addEventListener('DOMLoaded', () => {
      if (animRef.current !== a) {
        a.destroy();
        container.remove();
        layers.current.delete(a);
        return;
      }
      a.goToAndStop(frame >= 0 ? Math.min(frame, a.totalFrames - 1) : Math.floor(a.totalFrames * poster), true);
      if (playingRef.current && visibleRef.current) a.play();
      for (const [other, c] of layers.current) {
        if (other === a) continue;
        other.destroy();
        c.remove();
        layers.current.delete(other);
      }
    });
    a.addEventListener('loopComplete', () => onLoopRef.current?.());
  }, [animation, dpr]);

  // unmount
  useEffect(
    () => () => {
      for (const [a, c] of layers.current) {
        a.destroy();
        c.remove();
      }
      layers.current.clear();
      animRef.current = null;
    },
    [],
  );

  const playingRef = useRef(playing);
  const visibleRef = useRef(visible);
  playingRef.current = playing;
  visibleRef.current = visible;
  useEffect(() => {
    const a = animRef.current;
    if (!a) return;
    if (playing && visible) a.play();
    else a.pause();
  }, [playing, visible, animation]);

  return (
    <div ref={box} className={`player ${className || ''}`} style={{ aspectRatio: String(aspect) }}>
      {watermark && <div className="wm">▶ Made with Lamsa</div>}
      {children}
    </div>
  );
});

/**
 * Loads a template, applies the content and returns the resolved animation.
 * Text edits are debounced so typing stays smooth.
 */
export function useResolved(
  manifest: TemplateManifest | null | undefined,
  content: TemplateContent | null,
  scale = 1,
  debounceMs = 0,
): { animation: LottieAnimation | null; error: string | null } {
  const [animation, setAnimation] = useState<LottieAnimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = manifest && content ? JSON.stringify([manifest.id, manifest.version, content, scale]) : '';
  useEffect(() => {
    if (!manifest || !content) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const tpl = await loadTemplate(manifest);
        const anim = await applyContent(tpl, manifest, content, browserRenderers, { scale });
        if (!cancelled) setAnimation(anim);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(String(e?.message || e));
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { animation, error };
}
