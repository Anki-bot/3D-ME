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

      const container = image.current;
      const imageElement = container.querySelector("img");

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      const canHover = window.matchMedia("(hover: hover)").matches;
      const shouldEnableParallax =
        !prefersReducedMotion && isFinePointer && canHover;

      let reveal: gsap.core.Timeline | null = null;

      if (prefersReducedMotion) {
        gsap.set(container, { opacity: 1, scale: 1, y: 0, clearProps: "transform" });
        if (imageElement) {
          gsap.set(imageElement, { scale: 1, x: 0, y: 0, clearProps: "transform" });
        }
      } else {
        reveal = gsap.timeline();

        reveal.fromTo(
          container,
          {
            opacity: 0,
            scale: 0.97,
            y: 20,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          }
        );

        if (imageElement) {
          reveal.fromTo(
            imageElement,
            {
              scale: 1.08,
            },
            {
              scale: 1,
              duration: 1.2,
              ease: "power3.out",
            },
            0
          );
        }
      }

      let moveX: ((value: number) => void) | null = null;
      let moveY: ((value: number) => void) | null = null;
      let imageMoveX: ((value: number) => void) | null = null;
      let imageMoveY: ((value: number) => void) | null = null;

      if (shouldEnableParallax) {
        moveX = gsap.quickTo(container, "x", {
          duration: 0.8,
          ease: "power3.out",
        });

        moveY = gsap.quickTo(container, "y", {
          duration: 0.8,
          ease: "power3.out",
        });

        imageMoveX = imageElement
          ? gsap.quickTo(imageElement, "x", {
              duration: 1,
              ease: "power3.out",
            })
          : null;

        imageMoveY = imageElement
          ? gsap.quickTo(imageElement, "y", {
              duration: 1,
              ease: "power3.out",
            })
          : null;
      }

      const handleMouseMove = (event: MouseEvent) => {
        if (!shouldEnableParallax || !moveX || !moveY) return;
        const rect = container.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        moveX(x * 10);
        moveY(y * 10);
        imageMoveX?.(x * -14);
        imageMoveY?.(y * -14);
      };

      const handleMouseLeave = () => {
        if (!moveX || !moveY) return;
        moveX(0);
        moveY(0);
        imageMoveX?.(0);
        imageMoveY?.(0);
      };

      if (shouldEnableParallax) {
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);
      }

      return () => {
        if (shouldEnableParallax) {
          container.removeEventListener("mousemove", handleMouseMove);
          container.removeEventListener("mouseleave", handleMouseLeave);
        }

        reveal?.kill();
        gsap.killTweensOf(container);

        if (imageElement) {
          gsap.killTweensOf(imageElement);
        }
      };
    },
    {
      dependencies: [activeProject],
      scope: image,
      revertOnUpdate: true,
    }
  );
}