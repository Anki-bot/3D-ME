"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";

type SmoothScrollProps = {
  children: ReactNode;
};

export default function SmoothScroll({
  children,
}: SmoothScrollProps) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2,
      smoothWheel: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}