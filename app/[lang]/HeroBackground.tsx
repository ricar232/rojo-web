'use client';

import { useSyncExternalStore } from "react";

type Particle = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

// Particle positions are random and client-only (window size, Math.random).
// useSyncExternalStore lets the server/first-hydration render return an empty
// snapshot while the real client snapshot is generated once and cached, so
// there is never a server/client markup mismatch.
let cachedParticles: Particle[] | null = null;

function generateParticles(): Particle[] {
  const count = window.innerWidth < 768 ? 18 : 42;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    duration: 10 + Math.random() * 14,
    delay: Math.random() * -20,
    drift: (Math.random() - 0.5) * 120,
  }));
}

function subscribe() {
  return () => {};
}

function getSnapshot(): Particle[] {
  if (!cachedParticles) cachedParticles = generateParticles();
  return cachedParticles;
}

const emptyParticles: Particle[] = [];

function getServerSnapshot(): Particle[] {
  return emptyParticles;
}

export default function HeroBackground() {
  const particles = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="hero-bg-scene" aria-hidden="true">
      {/* Soft colour blobs: they give the frosted-glass surfaces on top
          something to blur, otherwise glass over flat orange reads as flat. */}
      <div className="glass-blob blob-peach" />
      <div className="glass-blob blob-ivory" />
      <div className="glass-blob blob-peach-deep" />
      <div className="orb-glow" />
      <div className="grain-overlay" />

      <div className="scan-sweep" />

      <div className="hero-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="hero-particle"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ["--drift" as string]: `${p.drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
