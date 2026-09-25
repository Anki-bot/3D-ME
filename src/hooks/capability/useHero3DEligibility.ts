"use client";

import { RefObject, useEffect, useState } from "react";
import { hero3dConfig, selectHero3DEligibility } from "@/config/hero3d";
import { useMediaQuery } from "./useMediaQuery";

export function useHero3DEligibility(
  heroRef: RefObject<HTMLElement | null>
): boolean {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isFinePointer = useMediaQuery("(pointer: fine)");
  const canHover = useMediaQuery("(hover: hover)");

  const [elementVisible, setElementVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );
  const [responsiveVisible, setResponsiveVisible] = useState(true);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setElementVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [heroRef]);

  useEffect(() => {
    const handleVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    // GlassOrb is hidden below lg (1024px) via `hidden lg:flex` ancestor, but hero itself is always visible.
    // Responsive gate for hero 3D: treat as visible always (hero is full-screen) — keep true to avoid hiding on mobile where fallback preferred via pointer gate.
    const update = () => setResponsiveVisible(true);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return selectHero3DEligibility({
    finePointer: isFinePointer,
    hover: canHover,
    reducedMotion: prefersReducedMotion,
    responsiveVisible,
    elementVisible,
    documentVisible,
    flagEnabled: hero3dConfig.enabled,
  });
}
