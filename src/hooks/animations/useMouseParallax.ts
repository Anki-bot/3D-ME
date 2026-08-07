"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface UseMouseParallaxProps {
  container: RefObject<HTMLElement | null>;
}

export function useMouseParallax({
  container,
}: UseMouseParallaxProps) {
  useGSAP(() => {
    const element = container.current;

    if (!element) return;

    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 30;
      const y = (event.clientY / window.innerHeight - 0.5) * 30;

      gsap.to(element, {
        x,
        y,
        duration: 1.5,
        ease: "power3.out",
      });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  });
}