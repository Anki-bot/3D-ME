"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface UseProjectImageAnimationProps {
  image: RefObject<HTMLDivElement | null>;
  activeProject: number;
}

export function useProjectImageAnimation({
  image,
  activeProject,
}: UseProjectImageAnimationProps) {
  useGSAP(
    () => {
      if (!image.current) return;

      gsap.fromTo(
        image.current,
        {
          opacity: 0,
          scale: 0.96,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    },
    {
      dependencies: [activeProject],
      scope: image,
    }
  );
}