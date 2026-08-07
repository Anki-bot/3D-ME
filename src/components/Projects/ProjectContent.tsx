import { Project } from "@/data/projects";
import ProjectActions from "./ProjectActions";

interface ProjectContentProps {
  project: Project;
}

export default function ProjectContent({
  project,
}: ProjectContentProps) {
  return (
    <div>
      <p className="mb-4 text-sm uppercase tracking-[0.4em] text-gray-500">
        {project.id.toString().padStart(2, "0")}
      </p>

      <h2 className="text-5xl font-bold leading-tight text-white lg:text-7xl">
        {project.title}
      </h2>

      <div className="mt-8 flex gap-6 text-sm uppercase tracking-widest text-gray-500">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>

      <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400">
        {project.description}
      </p>

      <ProjectActions />
    </div>
  );
}