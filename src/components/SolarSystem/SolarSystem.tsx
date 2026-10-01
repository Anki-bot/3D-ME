"use client";

import { useRef, useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/Projects/ProjectCard";
import SolarVideoSun from "./SolarVideoSun";

export default function SolarSystem() {
  const [activeProject, setActiveProject] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="projects" className="relative bg-black">
      {/* Intro - keep existing copy */}
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-end px-8 pb-12 lg:px-16">
        <div className="max-w-4xl">
          <p className="mb-6 text-sm uppercase tracking-[0.45em] text-zinc-500">Featured Projects</p>
          <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-white md:text-7xl">
            Selected work crafted with performance, motion, and storytelling.
          </h2>
        </div>
      </div>

      {/* Solar System - sun video at centre (same quality you shared), stays centre on swipe, projects orbit.
          Scroll height math: 100vh sticky viewport + ~80vh of scrub scroll per
          project (8 projects => 740vh total). Progress 0..1 maps evenly via
          floor(progress * N), and planet stagger completes near progress 0.9,
          so the last project lands exactly at the sticky end with no dead tail. */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${100 + projects.length * 80}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          {/* Sun video centre - same 153M quality */}
          <SolarVideoSun containerRef={containerRef} onProjectChange={setActiveProject} />

          {/* Project info overlay - bottom */}
          <div className="pointer-events-none absolute bottom-10 left-1/2 flex w-full max-w-5xl -translate-x-1/2 justify-center px-8">
            <div className="rounded-2xl border border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
              <p className="text-center text-sm uppercase tracking-[0.3em] text-zinc-400">
                {String(activeProject + 1).padStart(2, "0")} — {projects[activeProject].title}
              </p>
              <p className="mt-1 text-center text-xs text-zinc-500">{projects[activeProject].category} • {projects[activeProject].year}</p>
            </div>
          </div>

          {/* Progress dots - vertical */}
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
            {projects.map((_, i) => (
              <div
                key={i}
                className={`h-8 w-[2px] rounded-full transition-all duration-500 ${i === activeProject ? "bg-white h-14" : "bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fallback cards for mobile / non-WebGL - hidden on desktop, visible on small */}
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-24 sm:px-8 sm:pb-32 lg:px-16 lg:hidden">
        <div className="flex flex-col gap-24 sm:gap-32">
          {projects.map((project) => (
            <ProjectCard key={`fallback-${project.id}`} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
