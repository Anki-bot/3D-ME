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

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const image = container.current.querySelector(
        "[data-project-image]"
      );

      const content = container.current.querySelector(
        "[data-project-content]"
      );

      const elements = content?.querySelectorAll(
        "[data-project-element]"
      );

      if (prefersReducedMotion) {
        gsap.set(container.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: "transform",
        });
        if (image) {
          gsap.set(image as Element, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            clipPath: "inset(0 0% 0 0% round 2rem)",
            clearProps: "transform,clipPath",
          });
        }
        if (elements?.length) {
          gsap.set(elements as unknown as HTMLElement[], {
            opacity: 1,
            y: 0,
            clearProps: "transform",
          });
        }
        return;
      }

      const direction = activeProject % 2 === 0 ? 1 : -1;

      const tl = gsap.timeline();

      gsap.set(container.current, {
        opacity: 0,
        y: 10,
        scale: 0.995,
      });

      tl.to(container.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
      });

      if (image) {
        gsap.set(image, {
          opacity: 0,
          x: direction * 35,
          y: 20,
          scale: 1.04,
          clipPath: "inset(0 8% 0 8% round 2rem)",
        });

        tl.to(
          image,
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            clipPath: "inset(0 0% 0 0% round 2rem)",
            duration: 0.9,
            ease: "power3.out",
          },
          0.05
        );
      }

      if (elements?.length) {
        gsap.set(elements, {
          opacity: 0,
          y: 24,
        });

        tl.to(
          elements,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.16
        );
      }

      return () => {
        tl.kill();
      };
    },
    {
      dependencies: [activeProject],
      scope: container,
      revertOnUpdate: true,
    }
  );
}