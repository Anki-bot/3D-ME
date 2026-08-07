"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface UseProjectTransitionProps {
  container: RefObject<HTMLElement | null>;
  activeProject: number;
}

export function useProjectTransition({
  container,
  activeProject,
}: UseProjectTransitionProps) {
  useGSAP(
    () => {
      if (!container.current) return;

      gsap.fromTo(
        container.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        }
      );
    },
    {
      dependencies: [activeProject],
      scope: container,
    }
  );
}