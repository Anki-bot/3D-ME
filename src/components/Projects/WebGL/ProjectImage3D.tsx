"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { projects3dConfig } from "@/config/projects3d";
import ProjectPlane from "./ProjectPlane";

interface ProjectImage3DProps {
  image: string;
  progress: number;
  direction: number;
}

export default function ProjectImage3D({ image, progress, direction }: ProjectImage3DProps) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 sm:aspect-[16/10]"
    >
      <Canvas
        dpr={projects3dConfig.dpr}
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, projects3dConfig.dpr[1]));
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ProjectPlane image={image} progress={progress} direction={direction} />
          <ambientLight intensity={1.0} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}
