"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export default function GlassOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!orbRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const floating = gsap.to(orbRef.current, {
        y: -18,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      const rotation = gsap.to(orbRef.current, {
        rotate: 360,
        duration: 30,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });

      const breathing = gsap.to(orbRef.current, {
        scale: 1.03,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Visibility and document visibility eligibility - kill when hidden/offscreen
      let observer: IntersectionObserver | null = null;

      const killAll = () => {
        floating.kill();
        rotation.kill();
        breathing.kill();
      };

      if (containerRef.current) {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) {
              killAll();
            }
          },
          { threshold: 0 }
        );
        observer.observe(containerRef.current);
      }

      const handleVisibilityChange = () => {
        if (document.visibilityState !== "visible") {
          killAll();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      const handleReducedMotionChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          killAll();
        }
      };

      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

      return () => {
        floating.kill();
        rotation.kill();
        breathing.kill();
        observer?.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange
        );
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      {/* Outer Glow */}
      <div
        aria-hidden="true"
        className="absolute h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]"
      />

      {/* Middle Glow */}
      <div
        aria-hidden="true"
        className="absolute h-[340px] w-[340px] rounded-full bg-white/[0.045] blur-[100px]"
      />

      {/* Glass Orb */}
      <div
        ref={orbRef}
        className="relative h-[280px] w-[280px] rounded-full border border-white/20 bg-white/[0.06] shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-3xl will-change-transform"
      >
        {/* Highlight */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-56 w-10 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full bg-white/[0.12] blur-xl"
        />

        {/* Inner Ring */}
        <div className="absolute inset-6 rounded-full border border-white/10" />
      </div>
    </div>
  );
}