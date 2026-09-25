"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useHero3DEligibility } from "@/hooks/capability/useHero3DEligibility";

const AboutCanvas = dynamic(() => import("./AboutCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function AboutOrb3D() {
  const ref = useRef<HTMLDivElement>(null);
  const isEligible = useHero3DEligibility(ref);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute right-[8%] top-1/2 hidden h-64 w-64 -translate-y-1/2 lg:block">
      {isEligible ? (
        <AboutCanvas />
      ) : (
        <div className="h-full w-full rounded-full border border-white/[0.06]" />
      )}
    </div>
  );
}
