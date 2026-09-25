"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface GlowOrbProps {
  className: string;
  x: number;
  y: number;
  duration?: number;
}

export default function GlowOrb({
  className,
  x,
  y,
  duration = 8,
}: GlowOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!orbRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      let animation: gsap.core.Tween | null = null;
      let observer: IntersectionObserver | null = null;
      let isVisible = true;
      let isDocumentVisible = document.visibilityState === "visible";

      const createAnimation = () => {
        if (!orbRef.current || animation) return;
        if (!isVisible || !isDocumentVisible) return;
        animation = gsap.to(orbRef.current, {
          x,
          y,
          duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      };

      const killAnimation = () => {
        animation?.kill();
        animation = null;
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible && isDocumentVisible) {
            createAnimation();
          } else {
            killAnimation();
          }
        },
        { threshold: 0 }
      );

      if (orbRef.current) {
        observer.observe(orbRef.current);
      }

      const handleVisibilityChange = () => {
        isDocumentVisible = document.visibilityState === "visible";
        if (isDocumentVisible && isVisible) {
          createAnimation();
        } else {
          killAnimation();
        }
      };

      const handleReducedMotionChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          killAnimation();
        } else if (isVisible && isDocumentVisible) {
          createAnimation();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

      if (isVisible && isDocumentVisible) {
        createAnimation();
      }

      return () => {
        killAnimation();
        observer?.disconnect();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange
        );
      };
    },
    { scope: orbRef }
  );

  return (
    <div
      ref={orbRef}
      aria-hidden="true"
      className={`${className} will-change-transform`}
    />
  );
}