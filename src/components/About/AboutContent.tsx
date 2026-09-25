"use client";

import { useRef } from "react";
import { useSectionReveal } from "@/hooks/animations/useSectionReveal";

export default function AboutContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useSectionReveal({
    container: containerRef,
    items: [eyebrowRef, titleRef, descriptionRef],
  });

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-24 sm:px-8 lg:px-16"
    >

      {/* Section Index */}
      <div className="mb-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.35em] text-zinc-600">
        <span>01</span>
        <span className="h-px w-10 bg-white/10" />
        <span>About</span>
      </div>

      {/* Eyebrow */}
      <p
        ref={eyebrowRef}
        className="mb-5 text-xs uppercase tracking-[0.45em] text-zinc-500 sm:text-sm"
      >
        About
      </p>

      {/* Main Statement */}
      <h2
        ref={titleRef}
        className="max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
      >
        I build immersive digital experiences that blend creativity,
        interaction, and technology.
      </h2>

      {/* Lower Information */}
      <div className="mt-12 grid gap-10 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <p
          ref={descriptionRef}
          className="max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg sm:leading-9"
        >
          Every project is designed with performance, storytelling, motion,
          and usability in mind. The goal is not only to create beautiful
          interfaces, but experiences that people remember.
        </p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.3em] text-zinc-600 lg:max-w-xs lg:justify-end">
          <span>Creative Development</span>
          <span>Motion Design</span>
          <span>Interactive UI</span>
          <span>Web Experiences</span>
        </div>
      </div>
    </div>
  );
}