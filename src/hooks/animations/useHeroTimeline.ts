"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface HeroTimelineRefs {
  eyebrow: RefObject<HTMLElement | null>;
  title: RefObject<HTMLElement | null>;
  description: RefObject<HTMLElement | null>;
  button: RefObject<HTMLElement | null>;
}

export function useHeroTimeline(refs: HeroTimelineRefs) {
  useGSAP(() => {
    if (
      !refs.eyebrow.current ||
      !refs.title.current ||
      !refs.description.current ||
      !refs.button.current
    ) {
      return;
    }

    // Set the initial state before the animation starts.
    gsap.set(
      [
        refs.eyebrow.current,
        refs.title.current,
        refs.description.current,
        refs.button.current,
      ],
      {
        opacity: 0,
      }
    );

    gsap.set(refs.eyebrow.current, { y: 30 });
    gsap.set(refs.title.current, { y: 50 });
    gsap.set(refs.description.current, { y: 30 });
    gsap.set(refs.button.current, { y: 20 });
    const words = refs.title.current.querySelectorAll(".split-word");
    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    tl.to(refs.eyebrow.current, {
      opacity: 1,
      y: 0,
      duration: 0.7,
    })
    .to(
      refs.title.current,
      {
      opacity: 1,
      y: 0,
      duration: 0.3,
      },
      "-=0.35"
    )
    .from(
    words,
    {
    opacity: 0,
    y: 40,
    stagger: 0.12,
    duration: 0.9,
    },
    "<"
    )
      .to(
        refs.description.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
        },
        "-=0.5"
      )
      .to(
        refs.button.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
        },
        "-=0.45"
      );
  });
}