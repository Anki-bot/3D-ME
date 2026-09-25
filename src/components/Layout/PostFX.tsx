"use client";

import { useMediaQuery } from "@/hooks/capability/useMediaQuery";

export default function PostFX() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (prefersReducedMotion) return null;

  return (
    <>
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Grain - CSS only, no extra texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.015] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
