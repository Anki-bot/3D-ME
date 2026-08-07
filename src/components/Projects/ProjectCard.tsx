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
      className="grid min-h-screen items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-12"
    >
      {/* Left Side */}
        <ProjectContent project={project} />

      {/* Right Side */}
      <div className="flex items-center justify-center">
        <ProjectImage project={project} />
      </div>
    </article>
  );
}