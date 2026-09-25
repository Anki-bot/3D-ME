"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import GradientLayer from "./GradientLayer";
import NoiseLayer from "./NoiseLayer";
import Particles from "./Particles";
import { useMouseParallax } from "@/hooks/animations/useMouseParallax";
import { useHero3DEligibility } from "@/hooks/capability/useHero3DEligibility";

const WebGLCanvas = dynamic(() => import("./WebGLCanvas"), {
  ssr: false,
  loading: () => null,
});

function FallbackLayers() {
  return (
    <>
      <GradientLayer />
      <Particles />
      <NoiseLayer />
    </>
  );
}

export default function HeroBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useMouseParallax({
    container: backgroundRef,
  });

  const is3DEligible = useHero3DEligibility(backgroundRef);

  return (
    <div
      ref={backgroundRef}
      className="absolute inset-0 -z-10 overflow-hidden"
    >
      {is3DEligible ? (
        <>
          <WebGLCanvas />
          <div aria-hidden="true" className="absolute inset-0 opacity-40">
            <FallbackLayers />
          </div>
        </>
      ) : (
        <FallbackLayers />
      )}
    </div>
  );
}