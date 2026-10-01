"use client";

import { MutableRefObject, RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

interface UseSolarScrollProps {
  container: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  projectCount: number;
  onProjectChange: (index: number) => void;
  progressRef: MutableRefObject<number>;
  // Owned by orbit cards: while a card is hovered it freezes its own angle
  // in useFrame. Scroll math here never pauses so overlay/dots stay live.
  hoveredRef?: MutableRefObject<number | null>;
}

export function useSolarScroll({
  container,
  enabled,
  projectCount,
  onProjectChange,
  progressRef,
  hoveredRef,
}: UseSolarScrollProps) {
  useGSAP(() => {
    if (!enabled || !container.current || projectCount <= 0) return;
    void hoveredRef;

    const trigger = ScrollTrigger.create({
      trigger: container.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        const idx = Math.min(
          Math.floor(self.progress * projectCount),
          projectCount - 1
        );
        onProjectChange(idx);
      },
    });

    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
    };
  }, [enabled, projectCount]);
}
