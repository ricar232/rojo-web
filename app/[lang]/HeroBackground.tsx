'use client';

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// Three.js + its jsm addons (GLTFLoader, EffectComposer, RoomEnvironment...)
// weigh ~650KB on their own. Loading this dynamically keeps that whole chunk
// out of the initial script graph so it can't delay hydration of the actual
// page (nav, CTAs, text) — it's fetched right after, in the background.
const HeroRoomScene = dynamic(() => import("./HeroRoomScene"), { ssr: false });

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
      <div className="blueprint-grid" />
      <div className="orb-glow" />
      <div className="grain-overlay" />

      {/* Real WebGL 3D (Three.js): a room mid-remodel, split by an animated
          clipping plane — raw construction on one side, finished luxury
          interior on the other, sweeping back and forth. */}
      <HeroRoomScene />

      <div className="scan-sweep" />

      {[
        "corner-mark tl",
        "corner-mark tr",
        "corner-mark bl",
        "corner-mark br",
      ].map((cls) => (
        <svg key={cls} className={cls} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 14 V2 H14" stroke="#d4af37" strokeWidth="1.5" />
          <circle cx="2" cy="2" r="2" fill="#d4af37" />
        </svg>
      ))}

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

      {/* Darkens the whole animated background uniformly (it's a fixed layer
          behind every section) so page text/cards read with more contrast. */}
      <div className="scene-dim" />
    </div>
  );
}
