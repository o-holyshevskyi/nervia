"use client";

import { useCallback, useEffect, useRef } from "react";

const PARTICLE_COUNT = 70;
const CONNECT_THRESHOLD = 120;
const MOUSE_RADIUS = 150;
const PARTICLE_RADIUS = 2;
const BRAND_CYAN = "#06b6d4";
const BRAND_PURPLE = "#a855f7";
const BRAND_INDIGO = "#6366f1";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

function createParticles(width: number, height: number, accentColor: string): Particle[] {
  const particles: Particle[] = [];
  const colors = [BRAND_CYAN, accentColor];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: colors[i % colors.length],
    });
  }
  return particles;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

interface NeuralBackgroundProps {
  /** Unique id for the clip path when multiple instances exist (e.g. app header logo). */
  clipPathId?: string;
}

export function NeuralBackground({ clipPathId = "neural-brain-clip" }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const initOrResizeParticles = useCallback((width: number, height: number) => {
    if (particlesRef.current.length === 0) {
      const isDarkTheme = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const accent = isDarkTheme ? BRAND_PURPLE : BRAND_INDIGO;
      particlesRef.current = createParticles(width, height, accent);
    } else {
      particlesRef.current.forEach((p) => {
        p.x = p.x % (width + 1);
        p.y = p.y % (height + 1);
        if (p.x < 0) p.x += width;
        if (p.y < 0) p.y += height;
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const width = Math.floor(canvas.offsetWidth);
      const height = Math.floor(canvas.offsetHeight);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimensionsRef.current = { width, height };
      initOrResizeParticles(width, height);
    };

    setSize();
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(canvas);

    const tick = () => {
      const { width, height } = dimensionsRef.current;
      if (width <= 0 || height <= 0) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      });

      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = dist(particles[i], particles[j]);
          if (d < CONNECT_THRESHOLD) {
            const opacity = 1 - d / CONNECT_THRESHOLD;
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      if (mouse) {
        const isDarkTheme = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
        const accentRgb = isDarkTheme ? "168, 85, 247" : "99, 102, 241";
        const accentHex = isDarkTheme ? BRAND_PURPLE : BRAND_INDIGO;
        ctx.lineWidth = 1;
        particles.forEach((p) => {
          const d = dist(p, mouse);
          if (d < MOUSE_RADIUS) {
            const opacity = 1 - d / MOUSE_RADIUS;
            ctx.strokeStyle = `rgba(${accentRgb}, ${opacity * 0.5})`;
            ctx.shadowColor = accentHex;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      particles.forEach((p) => {
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, PARTICLE_RADIUS * 4
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.4, p.color + "99");
        gradient.addColorStop(1, p.color + "00");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_RADIUS * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [initOrResizeParticles]);

  return (
    <>
      <svg width={0} height={0} aria-hidden>
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* Brain silhouette: two lobes, central dip at top, rounded bottom */}
            <path d="M0.5,0.02 C0.22,0.06 0.02,0.32 0.05,0.58 C0.08,0.8 0.32,0.98 0.5,0.98 C0.68,0.98 0.92,0.8 0.95,0.58 C0.98,0.32 0.78,0.06 0.5,0.02 Z" />
          </clipPath>
        </defs>
      </svg>
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ clipPath: `url(#${clipPathId})`, pointerEvents: "auto" }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-hidden
        />
      </div>
    </>
  );
}
