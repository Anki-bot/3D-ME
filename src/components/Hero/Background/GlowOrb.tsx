"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface GlowOrbProps {
  className: string;
  x: number;
  y: number;
  duration?: number;
}

export default function GlowOrb({
  className,
  x,
  y,
  duration = 8,
}: GlowOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!orbRef.current) return;

    gsap.to(orbRef.current, {
      x,
      y,
      duration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  return <div ref={orbRef} className={className} />;
}