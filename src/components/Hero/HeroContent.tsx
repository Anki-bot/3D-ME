"use client";

import GlassOrb from "./Background/GlassOrb";
import { type MouseEvent, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useHeroTimeline } from "@/hooks/animations/useHeroTimeline";
import {
  getExploreWorkScrollBehavior,
  PROJECTS_FRAGMENT,
  PROJECTS_HEADING_ID,
  PROJECTS_SECTION_ID,
  REDUCED_MOTION_QUERY,
  shouldHandleExploreWorkActivation,
} from "@/lib/exploreWorkNavigation";

export default function HeroContent() {
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useHeroTimeline({
    eyebrow: eyebrowRef,
    title: titleRef,
    description: descriptionRef,
    button: buttonRef,
  });

  const handleExploreWorkActivation = (
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    if (!shouldHandleExploreWorkActivation(event)) return;

    const projects = document.getElementById(PROJECTS_SECTION_ID);
    const projectsHeading = document.getElementById(PROJECTS_HEADING_ID);
    if (!projects || !projectsHeading) return;

    event.preventDefault();

    if (window.location.hash !== PROJECTS_FRAGMENT) {
      window.history.pushState(null, "", PROJECTS_FRAGMENT);
    }

    const behavior = getExploreWorkScrollBehavior(
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
    );
    projects.scrollIntoView({ behavior, block: "start" });
    window.requestAnimationFrame(() => {
      projectsHeading.focus({ preventScroll: true });
    });
  };

  return (
    <div className="relative z-10 flex min-h-screen items-start px-6 py-24 pt-40 sm:px-8 sm:pt-40 lg:px-12 lg:pt-32">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-16 pt-8 lg:grid-cols-2 lg:items-center">
        {/* Left Side */}
        <div className="pt-4 sm:pt-6 lg:pt-0">
          <p
            ref={eyebrowRef}
            className="mb-6 text-xs uppercase tracking-[0.6em] text-gray-400"
          >
            Creative Developer • Designer • Interactive Experiences
          </p>

          <h1
            ref={titleRef}
            className="text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl xl:text-[8rem]"
          >
            Building
            <br />
            Digital
            <br />
            Experiences
          </h1>

          <p
            ref={descriptionRef}
            className="mt-10 max-w-xl text-lg leading-8 text-gray-300"
          >
            I create immersive digital experiences through modern web
            technologies, motion design, and interactive storytelling.
          </p>

          <div className="mt-14">
            <a
              ref={buttonRef}
              href="#projects"
              onClick={handleExploreWorkActivation}
              className="group relative inline-block overflow-hidden rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative flex items-center gap-3">
                Explore Work

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </a>
          </div>
        </div>

        {/* Right Side */}
        <div className="relative hidden h-[650px] items-center justify-center lg:flex">
          <GlassOrb />
        </div>
      </div>
    </div>
  );
}
