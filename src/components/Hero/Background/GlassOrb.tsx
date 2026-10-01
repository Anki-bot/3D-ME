"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export default function GlassOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!orbRef.current || !containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      let tweens: gsap.core.Tween[] = [];
      let observer: IntersectionObserver | null = null;
      let isVisible = true;
      let isDocumentVisible = document.visibilityState === "visible";

      const createAnimations = () => {
        if (!orbRef.current || tweens.length > 0) return;
        if (!isVisible || !isDocumentVisible) return;
        // Skip when hidden via CSS (e.g. `hidden lg:flex` parent on mobile)
        if (orbRef.current.offsetParent === null) return;
        tweens = [
          gsap.to(orbRef.current, {
            y: -18,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }),
          gsap.to(orbRef.current, {
            rotate: 360,
            duration: 30,
            repeat: -1,
            ease: "none",
            transformOrigin: "50% 50%",
          }),
          gsap.to(orbRef.current, {
            scale: 1.03,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }),
        ];
      };

      const killAll = () => {
        tweens.forEach((t) => t.kill());
        tweens = [];
      };

      const pauseAll = () => {
        tweens.forEach((t) => t.pause());
      };

      const resumeAll = () => {
        if (tweens.length === 0) {
          createAnimations();
        } else {
          tweens.forEach((t) => t.resume());
        }
      };

      // Visibility lifecycle: pause offscreen / hidden, resume when visible
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible && isDocumentVisible) {
            resumeAll();
          } else {
            pauseAll();
          }
        },
        { threshold: 0 }
      );
      observer.observe(containerRef.current);

      const handleVisibilityChange = () => {
        isDocumentVisible = document.visibilityState === "visible";
        if (isDocumentVisible && isVisible) {
          resumeAll();
        } else {
          pauseAll();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      const handleReducedMotionChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          killAll();
        } else if (isVisible && isDocumentVisible) {
          createAnimations();
        }
      };

      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

      // Handle CSS-hidden parents on resize (e.g. hidden on mobile)
      const handleResize = () => {
        if (orbRef.current?.offsetParent === null) {
          pauseAll();
        } else if (isVisible && isDocumentVisible) {
          resumeAll();
        }
      };
      window.addEventListener("resize", handleResize);

      createAnimations();

      return () => {
        killAll();
        observer?.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("resize", handleResize);
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