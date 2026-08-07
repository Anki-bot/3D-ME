"use client";

import { RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

interface UseProjectsScrollProps {
  container: RefObject<HTMLElement | null>;
  projectCount: number;
  onProjectChange: (index: number) => void;
}

export function useProjectsScroll({
  container,
  projectCount,
  onProjectChange,
}: UseProjectsScrollProps) {
  useGSAP(() => {
    if (!container.current) return;

    ScrollTrigger.create({
      trigger: container.current,
      start: "top top",
      end: "bottom bottom",

      onUpdate: (self) => {
        const progress = self.progress;

        const index = Math.min(
          Math.floor(progress * projectCount),
          projectCount - 1
        );

        onProjectChange(index);
      },
    });
  });
}