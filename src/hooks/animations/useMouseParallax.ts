"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface UseMouseParallaxProps {
  container: RefObject<HTMLElement | null>;
}

export function useMouseParallax({
  container,
}: UseMouseParallaxProps) {
  useGSAP(
    () => {
      const element = container.current;

      if (!element) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      const canHover = window.matchMedia("(hover: hover)").matches;

      if (prefersReducedMotion || !isFinePointer || !canHover) return;

      let tween: ((value: number) => void) | null = null;
      let tweenY: ((value: number) => void) | null = null;
      let observer: IntersectionObserver | null = null;
      let isVisible = true;
      let isDocumentVisible = document.visibilityState === "visible";
      let isListening = false;

      const ensureTweens = () => {
        if (!element) return;
        if (!tween) {
          tween = gsap.quickTo(element, "x", {
            duration: 1.2,
            ease: "power3.out",
          });
        }
        if (!tweenY) {
          tweenY = gsap.quickTo(element, "y", {
            duration: 1.2,
            ease: "power3.out",
          });
        }
      };

      const handleMove = (event: MouseEvent) => {
        if (!isVisible || !isDocumentVisible) return;
        ensureTweens();
        const x = (event.clientX / window.innerWidth - 0.5) * 30;
        const y = (event.clientY / window.innerHeight - 0.5) * 30;
        tween?.(x);
        tweenY?.(y);
      };

      const attach = () => {
        if (isListening) return;
        window.addEventListener("mousemove", handleMove);
        isListening = true;
      };

      const detach = () => {
        if (!isListening) return;
        window.removeEventListener("mousemove", handleMove);
        isListening = false;
      };

      const updateListening = () => {
        if (isVisible && isDocumentVisible) {
          attach();
        } else {
          detach();
        }
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          updateListening();
        },
        { threshold: 0 }
      );

      observer.observe(element);

      const handleVisibilityChange = () => {
        isDocumentVisible = document.visibilityState === "visible";
        updateListening();
      };

      const handleCapabilityChange = () => {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const fine = window.matchMedia("(pointer: fine)").matches;
        const hover = window.matchMedia("(hover: hover)").matches;
        if (reduced || !fine || !hover) {
          detach();
        } else {
          updateListening();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      const reducedQ = window.matchMedia("(prefers-reduced-motion: reduce)");
      const fineQ = window.matchMedia("(pointer: fine)");
      const hoverQ = window.matchMedia("(hover: hover)");
      reducedQ.addEventListener("change", handleCapabilityChange);
      fineQ.addEventListener("change", handleCapabilityChange);
      hoverQ.addEventListener("change", handleCapabilityChange);

      updateListening();

      return () => {
        detach();
        observer?.disconnect();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        reducedQ.removeEventListener("change", handleCapabilityChange);
        fineQ.removeEventListener("change", handleCapabilityChange);
        hoverQ.removeEventListener("change", handleCapabilityChange);
        if (element) {
          gsap.killTweensOf(element);
        }
      };
    },
    { scope: container }
  );
}