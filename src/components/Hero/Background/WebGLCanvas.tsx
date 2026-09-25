"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { hero3dConfig } from "@/config/hero3d";
import Hero3DScene from "./Hero3DScene";

export default function WebGLCanvas() {
  const [hasError, setHasError] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setHasError(true);
    };

    const handleContextRestored = () => {
      setHasError(false);
    };

    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost as EventListener);
      canvas.addEventListener("webglcontextrestored", handleContextRestored as EventListener);
      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost as EventListener);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored as EventListener);
      };
    }
  }, [hasError]);

  if (hasError) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        dpr={hero3dConfig.dpr}
        camera={{
          fov: hero3dConfig.camera.fov,
          position: hero3dConfig.camera.position,
        }}
        gl={{
          antialias: hero3dConfig.gl.antialias,
          powerPreference: hero3dConfig.gl.powerPreference,
        }}
        onCreated={({ gl }) => {
          rendererRef.current = gl as unknown as THREE.WebGLRenderer;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, hero3dConfig.dpr[1]));
        }}
        style={{ background: "transparent" }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Hero3DScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
