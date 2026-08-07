"use client";

import { useRef } from "react";
import { useSectionReveal } from "@/hooks/animations/useSectionReveal";

export default function AboutContent() {
  const containerRef = useRef<HTMLElement>(null);

  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useSectionReveal({
    container: containerRef,
    items: [eyebrowRef, titleRef, descriptionRef],
  });

  return (
    <section
      ref={containerRef}
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-24 lg:px-12"
    >
      <p
        ref={eyebrowRef}
        className="mb-4 text-sm uppercase tracking-[0.4em] text-gray-500"
      >
        About
      </p>

      <h2
        ref={titleRef}
        className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
      >
        I build immersive digital experiences that blend creativity,
        interaction, and technology.
      </h2>

      <p
        ref={descriptionRef}
        className="mt-10 max-w-2xl text-lg leading-8 text-gray-400"
      >
        Every project is designed with performance, storytelling, motion,
        and usability in mind. The goal is not only to create beautiful
        interfaces, but experiences that people remember.
      </p>
    </section>
  );
}
