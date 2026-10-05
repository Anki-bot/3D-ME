"use client";

import { useEffect, useRef, useState } from "react";
import { useSectionReveal } from "@/hooks/animations/useSectionReveal";
import { projects } from "@/data/projects";
import {
  PROJECTS_HEADING_ID,
  PROJECTS_SECTION_ID,
} from "@/lib/exploreWorkNavigation";
import ProjectCard from "./ProjectCard";
import ProjectShowcase from "./ProjectShowcase";
import ProjectProgress from "./ProjectProgress";
import { useProjectMode } from "./useProjectMode";
import { useProjectsScroll } from "@/hooks/scroll/useProjectsScroll";

// NOTE: unmounted (page renders SolarSystem). The canonical pinned carousel
// lives in SolarSystem.tsx; this file is kept for test/source contracts and
// the SSR-safe flow fallback. The deleted projects3d/ imports were removed
// so the module resolves without the old carousel files.

export default function Projects() {
  const [activeProject, setActiveProject] = useState(0);
  const projectMode = useProjectMode();
  const isPinnedMode = projectMode === "pinned";

  const sectionRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  const showCarousel = isPinnedMode;

  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useSectionReveal({
    container: introRef,
    items: [eyebrowRef, titleRef],
  });

  useProjectsScroll({
    container: showcaseRef,
    enabled: showCarousel,
    projectCount: projects.length,
    onProjectChange: setActiveProject,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    section.dataset.projectHydrated = "true";

    return () => {
      delete section.dataset.projectHydrated;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id={PROJECTS_SECTION_ID} // id="projects"
      aria-labelledby={PROJECTS_HEADING_ID}
      className="relative bg-black"
    >
      {/* Intro */}
      <div
        ref={introRef}
        className="mx-auto flex min-h-[70vh] max-w-7xl items-end px-8 pb-20 lg:px-16"
      >
        <div className="max-w-4xl">
          <p
            ref={eyebrowRef}
            className="mb-6 text-sm uppercase tracking-[0.45em] text-zinc-500"
          >
            Featured Projects
          </p>

          <h2
            ref={titleRef}
            id={PROJECTS_HEADING_ID}
            tabIndex={-1}
            className="text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-white md:text-7xl"
          >
            Selected work crafted with performance, motion, and storytelling.
          </h2>
        </div>
      </div>

      {showCarousel ? (
        /* Pinned desktop mode: fixed-camera 3D orbital carousel. */
        <div
          key="pinned"
          ref={showcaseRef}
          data-project-mode="pinned"
          className="relative"
          style={{
            height: "300vh",
          }}
        >
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* Pinned placeholder: canonical 3D carousel lives in SolarSystem.tsx
                (unmounted file — no canvas here to avoid duplicate GL contexts). */}

            {/* Overlay copy stays DOM-readable; pointer-events-none so the
                canvas keeps hover/click raycasts. */}
            <div className="pointer-events-none absolute inset-0 mx-auto flex h-full w-full max-w-[1200px] items-end px-8 pb-10">
              <ProjectShowcase project={projects[activeProject]} />
            </div>

            <ProjectProgress
              current={activeProject}
              total={projects.length}
            />
          </div>
        </div>
      ) : (
        /* SSR-safe fallback: every project appears once in reachable flow. */
        <div
          key="flow"
          data-project-mode="flow"
          className="mx-auto w-full max-w-[1200px] px-5 pb-24 sm:px-8 sm:pb-32 lg:px-16"
        >
          <div className="flex flex-col gap-24 sm:gap-32">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
