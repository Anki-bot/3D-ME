"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface FloatingOptions {
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
}

export function useFloating(
  ref: RefObject<HTMLElement | null>,
  {
    x = 0,
    y = -20,
    duration = 6,
    delay = 0,
  }: FloatingOptions = {}
) {
  useGSAP(
    () => {
      if (!ref.current) return;

      gsap.to(ref.current, {
        x,
        y,
        duration,
        delay,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: ref }
  );
}