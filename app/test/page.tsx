"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TOTAL_FRAMES = 145;

export default function TestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Preload all frames
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let done = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const idx = String(i).padStart(3, "0");
      img.src = `/frames/f${idx}.jpg`;
      img.onload = () => {
        done++;
        setLoadCount(done);
        if (done === TOTAL_FRAMES) {
          setLoaded(true);
          // Draw first frame
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx) {
            ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
          }
        }
      };
      images.push(img);
    }
    framesRef.current = images;
  }, []);

  // Scroll → draw frame
  useEffect(() => {
    if (!loaded) return;

    function onScroll() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!container || !canvas || !ctx) return;

      const totalScroll = container.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / totalScroll));
      setProgress(p);

      const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(p * TOTAL_FRAMES));
      const img = framesRef.current[frameIdx];
      if (img?.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded]);

  const scene1 = opacity(progress, 0,    0.15, 0.28, 0.38);
  const scene2 = opacity(progress, 0.35, 0.48, 0.60, 0.70);
  const scene3 = opacity(progress, 0.68, 0.80, 1,    1   );

  return (
    <div>
      <div ref={containerRef} style={{ height: "250vh" }} className="relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden">

          {/* CANVAS — instant frame drawing */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Loading overlay */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "#0A0716" }}>
              <div className="text-white/60 text-sm mb-3">Loading experience…</div>
              <div className="w-48 h-1 rounded-full bg-white/10">
                <div className="h-full rounded-full gold-grad transition-all duration-200"
                  style={{ width: `${(loadCount / TOTAL_FRAMES) * 100}%` }} />
              </div>
              <div className="text-white/30 text-xs mt-2">{loadCount} / {TOTAL_FRAMES}</div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,7,22,0.5) 0%, rgba(10,7,22,0.2) 50%, rgba(10,7,22,0.65) 100%)" }} />

          {/* SCENE 1 */}
          <div className="absolute inset-0 flex items-center px-10 md:px-24 pointer-events-none"
            style={{ opacity: scene1, transition: "opacity 0.4s ease" }}>
            <div className="max-w-2xl">
              <p className="text-white/50 uppercase tracking-widest text-xs mb-4">Jordan, 2026</p>
              <h1 className="font-display font-extrabold leading-tight mb-5"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
                46% of graduates<br />
                <span style={{ color: "#F5B82E" }}>can't find work.</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
                Your CV is rejected before a human ever reads it.
              </p>
            </div>
          </div>

          {/* SCENE 2 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: scene2, transition: "opacity 0.4s ease" }}>
            <div className="text-center max-w-2xl px-8">
              <p className="text-white/50 uppercase tracking-widest text-xs mb-4">The fix</p>
              <h2 className="font-display font-extrabold leading-tight mb-5"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
                Your story{" "}
                <span style={{ color: "#F5B82E" }}>deserves</span>
                <br />to be told right.
              </h2>
              <p className="text-white/70 text-lg" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
                Experience ✓ &nbsp;&nbsp; Skills ⚡ &nbsp;&nbsp; Summary ✨
              </p>
            </div>
          </div>

          {/* SCENE 3 — video has Hired.jo baked in, just show CTAs */}
          <div className="absolute inset-0 flex items-end justify-center pb-20"
            style={{ opacity: scene3, transition: "opacity 0.4s ease", pointerEvents: scene3 > 0.5 ? "auto" : "none" }}>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/build" className="px-8 py-4 rounded-2xl gold-grad text-black font-bold text-lg">
                Build my CV →
              </Link>
              <Link href="/roast" className="px-8 py-4 rounded-2xl glass text-white font-bold text-lg">
                🔥 Roast my CV
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div className="h-full gold-grad" style={{ width: `${progress * 100}%`, transition: "width 0.05s linear" }} />
          </div>

          {/* Scroll hint */}
          {loaded && progress < 0.03 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-sm animate-bounce">
              <span>scroll</span>
              <span>↓</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-24 flex items-center justify-center border-t border-white/10">
        <p className="text-white/20 text-xs">rest of landing page continues below</p>
      </div>
    </div>
  );
}

function opacity(p: number, i0: number, i1: number, o0: number, o1: number) {
  if (p < i0) return 0;
  if (p < i1) return (p - i0) / (i1 - i0);
  if (p < o0) return 1;
  if (p < o1) return 1 - (p - o0) / (o1 - o0);
  return 0;
}
