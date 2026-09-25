"use client";

import { useRef } from "react";
import { Project } from "@/data/projects";
import { useProjectTransition } from "@/hooks/animations/useProjectTransition";
import ProjectImage from "./ProjectImage";
import ProjectContent from "./ProjectContent";

interface ProjectShowcaseProps {
  project: Project;
}

export default function ProjectShowcase({
  project,
}: ProjectShowcaseProps) {
  const showcaseRef = useRef<HTMLElement>(null);

  useProjectTransition({
    container: showcaseRef,
    activeProject: project.id,
  });

  return (
    <article
      ref={showcaseRef}
      data-project-id={project.id}
      className="flex w-full items-center"
    >
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-16 xl:gap-24">
        <ProjectImage project={project} />

        <ProjectContent project={project} />
      </div>
    </article>
  );
}