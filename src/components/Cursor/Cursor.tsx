"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor) return;

    // Capability gates: fine pointer + hover + no reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    if (prefersReducedMotion || !isFinePointer || !canHover) {
      return;
    }

    let isActive = false;

    const activateCursor = () => {
      if (isActive) return;
      isActive = true;
      document.documentElement.classList.add("custom-cursor-active");
      document.documentElement.setAttribute("data-custom-cursor", "active");
    };

    const deactivateCursor = () => {
      isActive = false;
      document.documentElement.classList.remove("custom-cursor-active");
      document.documentElement.removeAttribute("data-custom-cursor");
    };

    const moveX = gsap.quickTo(cursor, "x", {
      duration: 0.2,
      ease: "power3.out",
    });

    const moveY = gsap.quickTo(cursor, "y", {
      duration: 0.2,
      ease: "power3.out",
    });

    const moveCursor = (event: MouseEvent) => {
      activateCursor();
      moveX(event.clientX);
      moveY(event.clientY);
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest("header")) {
        // Header hover: transparent with Electric Blue border only
        gsap.to(cursor, {
          scale: 1.8,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(cursor, {
          backgroundColor: "transparent",
          borderColor: "#00FFFF",
          duration: 0.2,
        });
        cursor.style.mixBlendMode = "normal";
        return;
      }

      if (target.closest("button, a, [role='button']")) {
        gsap.to(cursor, {
          scale: 1.8,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(cursor, {
          backgroundColor: "#39FF14",
          borderColor: "#39FF14",
          duration: 0.2,
        });
        cursor.style.mixBlendMode = "normal";
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement | null;

      const currentInteractive = target.closest(
        "button, a, [role='button']"
      );
      const headerInteractive = target.closest("header");

      const nextInteractive = relatedTarget?.closest(
        "button, a, [role='button']"
      );
      const nextHeader = relatedTarget?.closest("header");

      if ((currentInteractive && !nextInteractive) || (headerInteractive && !nextHeader)) {
        gsap.to(cursor, {
          scale: 1,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(cursor, {
          backgroundColor: "transparent",
          borderColor: "#ffffff",
          duration: 0.2,
        });
        cursor.style.mixBlendMode = "difference";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        deactivateCursor();
      }
    };

    const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mediaFine = window.matchMedia("(pointer: fine)");
    const mediaHover = window.matchMedia("(hover: hover)");

    const handleCapabilityChange = () => {
      if (
        mediaReduced.matches ||
        !mediaFine.matches ||
        !mediaHover.matches
      ) {
        deactivateCursor();
      }
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    mediaReduced.addEventListener("change", handleCapabilityChange);
    mediaFine.addEventListener("change", handleCapabilityChange);
    mediaHover.addEventListener("change", handleCapabilityChange);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mediaReduced.removeEventListener("change", handleCapabilityChange);
      mediaFine.removeEventListener("change", handleCapabilityChange);
      mediaHover.removeEventListener("change", handleCapabilityChange);

      deactivateCursor();
      gsap.killTweensOf(cursor);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-transparent mix-blend-difference cursor-dot"
      style={{ borderColor: "#ffffff", backgroundColor: "transparent" }}
    />
  );
}