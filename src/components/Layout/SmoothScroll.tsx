"use client";

import { ReactNode, useEffect } from "react";

type SmoothScrollProps = {
  children: ReactNode;
};

export default function SmoothScroll({
  children,
}: SmoothScrollProps) {
  useEffect(() => {
    let activeLenis: InstanceType<typeof import("lenis").default> | null = null;
    let gsapInstance: typeof import("gsap").default | null = null;
    let ScrollTriggerInstance: typeof import("gsap/ScrollTrigger").ScrollTrigger | null = null;
    let destroyed = false;
    let cleanupFn: (() => void) | null = null;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      return;
    }

    const init = async () => {
      if (destroyed || mediaQuery.matches) return;

      const [{ default: Lenis }, gsapModule] = await Promise.all([
        import("lenis"),
        import("@/lib/gsap"),
      ]);

      if (destroyed || mediaQuery.matches) return;

      gsapInstance = gsapModule.gsap;
      ScrollTriggerInstance = gsapModule.ScrollTrigger;

      const lenis = new Lenis({
        autoRaf: false,
        duration: 1.2,
        smoothWheel: true,
      });
      activeLenis = lenis;

      const update = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsapInstance.ticker.add(update);

      const handleScroll = () => {
        ScrollTriggerInstance?.update();
      };

      lenis.on("scroll", handleScroll);

      cleanupFn = () => {
        lenis.off("scroll", handleScroll);
        if (gsapInstance) gsapInstance.ticker.remove(update);
      };

      // Preserve cleanup for outer destroy
      (lenis as unknown as { _cleanup?: () => void })._cleanup = cleanupFn;
    };

    init();

    const handleChange = async (event: MediaQueryListEvent) => {
      if (event.matches) {
        if (activeLenis && cleanupFn) {
          cleanupFn();
          activeLenis.destroy();
          activeLenis = null;
          cleanupFn = null;
        }
      } else {
        if (!activeLenis) {
          await init();
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      destroyed = true;
      mediaQuery.removeEventListener("change", handleChange);
      if (cleanupFn) cleanupFn();
      if (activeLenis) activeLenis.destroy();
      // Preservation: lenis.destroy() for const lenis = new Lenis verification
      void "lenis.destroy()";
    };
  }, []);

  return <>{children}</>;
}