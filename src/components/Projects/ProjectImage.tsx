import { useRef } from "react";
import Image from "next/image";
import { Project } from "@/data/projects";
import { useProjectImageAnimation } from "@/hooks/animations/useProjectImageAnimation";

interface ProjectImageProps {
  project: Project;
}

export default function ProjectImage({
  project,
}: ProjectImageProps) {
    const imageRef = useRef<HTMLDivElement>(null);

useProjectImageAnimation({
  image: imageRef,
  activeProject: project.id,
});
  return (
  <div
  ref={imageRef}
  className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900"
>
    <Image
      src={project.image}
      alt={project.title}
      fill
      className="object-cover transition-transform duration-700 hover:scale-105"
      sizes="(max-width: 1024px) 100vw, 50vw"
      priority={project.id === 1}
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
  </div>
);
}