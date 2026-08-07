"use client";

import { RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

interface SectionRevealRefs {
  container: RefObject<HTMLElement | null>;
  items: RefObject<HTMLElement | null>[];
}

export function useSectionReveal({
  container,
  items,
}: SectionRevealRefs) {
  useGSAP(() => {
    if (!container.current) return;

    const elements = items
      .map((item) => item.current)
      .filter(Boolean) as HTMLElement[];

    gsap.set(elements, {
      opacity: 0,
      y: 40,
    });

    gsap.to(elements, {
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
  });
}