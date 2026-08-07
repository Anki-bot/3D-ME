"use client";

import { useRef } from "react";
import { useHeroTimeline } from "@/hooks/animations/useHeroTimeline";
import SplitText from "@/components/UI/SplitText";

export default function HeroContent() {
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useHeroTimeline({
    eyebrow: eyebrowRef,
    title: titleRef,
    description: descriptionRef,
    button: buttonRef,
  });

  return (
    <div className="relative z-10 mx-auto max-w-5xl text-center">
      <p
        ref={eyebrowRef}
        className="mb-4 text-sm uppercase tracking-[0.4em] text-gray-500 opacity-0"
      >
        Creative Developer • Designer • Interactive Experiences
      </p>

      <h1
        ref={titleRef}
        className="text-5xl font-bold leading-tight text-white opacity-0 sm:text-7xl lg:text-8xl"
    >
        <SplitText text="Building Digital Experiences" />
      </h1>

      <p
        ref={descriptionRef}
        className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-gray-400 opacity-0"
     >
        I create immersive, high-performance digital experiences using modern
        web technologies, animation, and interactive design.
      </p>

      <div className="mt-12 flex justify-center">
        <button
        ref={buttonRef}
        className="rounded-full border border-white px-8 py-4 text-sm font-medium uppercase tracking-widest opacity-0 transition-all duration-300 hover:bg-white hover:text-black"
        >
          Explore Work
        </button>
      </div>
    </div>
  );
}