"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Project } from "@/data/projects";
import { useProjectImageAnimation } from "@/hooks/animations/useProjectImageAnimation";
import { useProjectMode } from "./useProjectMode";
import { useMediaQuery } from "@/hooks/capability/useMediaQuery";
import { projects3dConfig, selectProjects3DEligibility } from "@/config/projects3d";

const ProjectImage3D = dynamic(() => import("./WebGL/ProjectImage3D"), {
  ssr: false,
  loading: () => null,
});

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

  const mode = useProjectMode();
  const isPinnedMode = mode === "pinned";
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isFinePointer = useMediaQuery("(pointer: fine)");
  const canHover = useMediaQuery("(hover: hover)");

  const isEligible = selectProjects3DEligibility({
    isPinnedMode,
    finePointer: isFinePointer,
    hover: canHover,
    reducedMotion: prefersReducedMotion,
    elementVisible: true,
    documentVisible: typeof document !== "undefined" ? document.visibilityState === "visible" : true,
    flagEnabled: projects3dConfig.enabled,
  });

  // Direction alternates via id parity (preserves audit)
  const direction = project.id % 2 === 0 ? 1 : -1;
  // Progress driven by activeProject index (0..1) — shader uProgress
  const progress = 0; // static for now; future drives via scroll progress

  if (isEligible) {
    return (
      <div ref={imageRef} data-project-image>
        <ProjectImage3D image={project.image} progress={progress} direction={direction} />
      </div>
    );
  }

  return (
    <div
      ref={imageRef}
      data-project-image
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl transition-colors duration-700 hover:border-white/20 sm:aspect-[16/10]"
    >
      <Image
        src={project.image}
        alt={project.title}
        fill
        priority={project.id === 1}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover transition-transform duration-1000 ease-out will-change-transform transform-gpu group-hover:scale-[1.04]"
      />

      {/* Cinematic Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

      {/* Hover Highlight */}
      <div className="pointer-events-none absolute inset-0 bg-white/[0.025] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
    </div>
  );
}