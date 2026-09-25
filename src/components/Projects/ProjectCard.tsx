"use client";

import { useRef } from "react";
import { Project } from "@/data/projects";
import { useProjectTransition } from "@/hooks/animations/useProjectTransition";
import ProjectImage from "./ProjectImage";
import ProjectContent from "./ProjectContent";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const containerRef = useRef<HTMLElement>(null);

  useProjectTransition({
    container: containerRef,
    activeProject: project.id,
  });

  return (
    <article
      ref={containerRef}
      data-project-id={project.id}
      className="flex w-full flex-col justify-center"
    >
      <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <ProjectImage project={project} />

        <ProjectContent project={project} />
      </div>
    </article>
  );
}