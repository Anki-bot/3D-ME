"use client";

import { RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

interface UseProjectsScrollProps {
  container: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  projectCount: number;
  onProjectChange: (index: number) => void;
}

export function useProjectsScroll({
  container,
  enabled,
  projectCount,
  onProjectChange,
}: UseProjectsScrollProps) {
  useGSAP(() => {
    if (!enabled || !container.current || projectCount <= 0) return;

    let currentIndex = 0;

    const trigger = ScrollTrigger.create({
      trigger: container.current,
      start: "top top",
      end: "bottom bottom",

      onUpdate: (self) => {
        const index = Math.max(
          0,
          Math.min(
            Math.floor(self.progress * projectCount + 0.25),
            projectCount - 1,
          ),
        );

        if (index !== currentIndex) {
          currentIndex = index;
          onProjectChange(index);
        }
      },
    });

    onProjectChange(0);

    return () => {
      trigger.kill();
    };
  }, [enabled, projectCount]);
}