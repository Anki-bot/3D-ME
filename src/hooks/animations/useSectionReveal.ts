"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface SectionRevealRefs {
  container: RefObject<HTMLElement | null>;
  items: RefObject<HTMLElement | null>[];
}

export function useSectionReveal({
  container,
  items,
}: SectionRevealRefs) {
  useGSAP(
    () => {
      if (!container.current) return;

      const elements = items
        .map((item) => item.current)
        .filter(Boolean) as HTMLElement[];

      if (!elements.length) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(elements, {
          opacity: 1,
          y: 0,
          clearProps: "transform",
        });
        return;
      }

      gsap.set(elements, {
        opacity: 0,
        y: 40,
      });

      const tween = gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      const handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          tween.kill();
          gsap.set(elements, {
            opacity: 1,
            y: 0,
            clearProps: "transform",
          });
        }
      };

      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", handleChange);

      return () => {
        query.removeEventListener("change", handleChange);
      };
    },
    {
      scope: container,
      revertOnUpdate: true,
    }
  );
}