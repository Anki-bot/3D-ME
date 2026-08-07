"use client";

import { useRef } from "react";
import GradientLayer from "./GradientLayer";
import NoiseLayer from "./NoiseLayer";
import Particles from "./Particles";
import { useMouseParallax } from "@/hooks/animations/useMouseParallax";

export default function HeroBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useMouseParallax({
    container: backgroundRef,
  });

  return (
    <div
      ref={backgroundRef}
      className="absolute inset-0 -z-10 overflow-hidden"
    >
      <GradientLayer />
      <Particles />
      <NoiseLayer />
    </div>
  );
}