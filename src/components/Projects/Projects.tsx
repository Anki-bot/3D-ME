"use client";

import { useRef, useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import ProjectProgress from "./ProjectProgress";
import { useProjectsScroll } from "@/hooks/scroll/useProjectsScroll";

export default function Projects() {
    const [activeProject, setActiveProject] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);
    useProjectsScroll({
    container: sectionRef,
    projectCount: projects.length,
    onProjectChange: setActiveProject,
    });
  return (
    <section
    ref={sectionRef}
    className="relative h-[400vh] bg-black"
    id="projects"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 lg:px-12">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-gray-500">
            Featured Projects
          </p>

          <h2 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Selected work crafted with performance, motion, and storytelling.
          </h2>
        </div>

        <ProjectCard project={projects[activeProject]} />

        <ProjectProgress
        current={activeProject}
        total={projects.length}
        />
      </div>
    </section>
  );
}