"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function useGSAPReveal(
  ref: RefObject<HTMLElement | null>,
  delay = 0
) {
  useGSAP(
    () => {
      if (!ref.current) return;

      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          delay,
        }
      );
    },
    { scope: ref }
  );
}