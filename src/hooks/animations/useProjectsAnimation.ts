"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface UseProjectsAnimationProps {
  container: RefObject<HTMLElement | null>;
}

export function useProjectsAnimation({
  container,
}: UseProjectsAnimationProps) {
  useGSAP(
    () => {
      if (!container.current) return;

      gsap.set(container.current, {
        opacity: 1,
      });
    },
    {
      scope: container,
    }
  );
}