"use client";

import { Project } from "@/data/projects";

interface ProjectContentProps {
  project: Project;
}

export default function ProjectContent({
  project,
}: ProjectContentProps) {
  return (
    <div
      data-project-content
      className="mt-10 max-w-[720px] lg:mt-0"
    >
      <p
        data-project-element
        className="mb-4 text-sm uppercase tracking-[0.4em] text-zinc-500"
      >
        {project.id.toString().padStart(2, "0")}
      </p>

      <h2
        data-project-element
        className="mt-5 max-w-[12ch] text-5xl font-semibold leading-[0.9] tracking-[-0.04em] text-white md:text-6xl xl:text-7xl">
        {project.title}
      </h2>

      <div
        data-project-element
        className="mt-6 flex items-center gap-4 text-sm uppercase tracking-[0.2em] text-zinc-500"
      >
        <span>{project.category}</span>

        <span className="h-1 w-1 rounded-full bg-zinc-600" />

        <span>{project.year}</span>
      </div>

      <p
        data-project-element
        className="mt-8 max-w-[42rem] text-lg leading-9 text-zinc-400"
      >
        {project.description}
      </p>
    </div>
  );
}