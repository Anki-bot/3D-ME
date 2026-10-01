"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Project } from "@/data/projects";
import { getProjectMedia } from "@/data/projectMedia";
import { OrbitParams } from "./orbitTable";

const FULL_REVOLUTION = Math.PI * 2;

interface ProjectOrbitCardProps {
  project: Project;
  index: number;
  total: number;
  /** Shared scroll progress 0..1 (or quantized steps under reduced motion) */
  progressRef: MutableRefObject<number>;
  /** Index of the currently hovered card, or null */
  hoveredRef: MutableRefObject<number | null>;
  orbit: OrbitParams;
  /** Set false when tab hidden / canvas offscreen to skip work */
  visibilityRef?: MutableRefObject<boolean>;
}

export default function ProjectOrbitCard({
  project,
  index,
  total,
  progressRef,
  hoveredRef,
  orbit,
  visibilityRef,
}: ProjectOrbitCardProps) {
  const [hovered, setHovered] = useState(false);
  const [videoTexture, setVideoTexture] =
    useState<THREE.VideoTexture | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const overlayRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(0);
  const texture = useTexture(project.image);
  const tiltEuler = useRef(
    new THREE.Euler(orbit.tiltX, 0, orbit.tiltZ)
  );
  const tmpVec = useRef(new THREE.Vector3());

  // Hover VideoTexture: mount only after successful `canplay` so missing
  // placeholder mp4s stay silent image cards.
  useEffect(() => {
    if (!hovered) return;
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let video: HTMLVideoElement | null = null;
    let tex: THREE.VideoTexture | null = null;

    const cleanup = () => {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (tex) tex.dispose();
      video = null;
      tex = null;
    };

    try {
      video = document.createElement("video");
      video.src = getProjectMedia(project.id).hoverVideo;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";

      const handleCanPlay = () => {
        if (disposed || !video) return;
        tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        setVideoTexture(tex);
        video.play().catch(() => undefined);
      };
      const handleError = () => {
        cleanup();
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);
      video.load();

      return () => {
        disposed = true;
        video?.removeEventListener("canplay", handleCanPlay);
        video?.removeEventListener("error", handleError);
        cleanup();
        setVideoTexture((current) => {
          if (current && current !== tex) current.dispose();
          return null;
        });
      };
    } catch {
      cleanup();
      return undefined;
    }
  }, [hovered, project.id]);

  // Cursor affordance only (never global `cursor: none`).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  // Scroll-driven orbital math + billboard + hover-video fade.
  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (visibilityRef?.current === false) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    )
      return;

    const t = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    const baseAngle = (index / total) * FULL_REVOLUTION;
    const angle = baseAngle + t * FULL_REVOLUTION;
    // Pause this card's orbital math while hovered; scroll progress itself
    // keeps flowing so overlay/dots stay live.
    if (hoveredRef.current !== index) {
      angleRef.current = angle;
    }
    const a = angleRef.current;
    tmpVec.current
      .set(
        Math.cos(a) * orbit.rx,
        orbit.y,
        Math.sin(a) * orbit.rz
      )
      .applyEuler(tiltEuler.current);
    group.position.copy(tmpVec.current);
    // Always face the camera.
    group.lookAt(camera.position);
    // Foreground cards scale up as they swing to the front.
    group.scale.setScalar(1 + 0.25 * Math.cos(a));

    if (overlayRef.current) {
      const material = overlayRef.current.material as THREE.MeshBasicMaterial;
      const target = hovered && videoTexture ? 1 : 0;
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        target,
        8,
        delta
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glassmorphism card */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          if (
            typeof window !== "undefined" &&
            window.matchMedia("(hover: none)").matches
          )
            return;
          hoveredRef.current = index;
          setHovered(true);
        }}
        onPointerOut={() => {
          if (hoveredRef.current === index) hoveredRef.current = null;
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          window.open(
            getProjectMedia(project.id).url,
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        <planeGeometry args={[3.4, 2.2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.82}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Project image */}
      <mesh position={[0, 0.2, 0.07]}>
        <planeGeometry args={[2.9, 1.5]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Hover video overlay (image-only until `canplay`) */}
      <mesh ref={overlayRef} position={[0, 0.2, 0.08]}>
        <planeGeometry args={[2.9, 1.5]} />
        {videoTexture ? (
          <meshBasicMaterial
            map={videoTexture}
            transparent
            opacity={0}
            toneMapped={false}
          />
        ) : (
          <meshBasicMaterial transparent opacity={0} />
        )}
      </mesh>

      {/* Title / category / year mapped onto the plane */}
      <Text
        position={[0, -0.72, 0.09]}
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
      >
        {project.title.toUpperCase()}
      </Text>
      <Text
        position={[0, -0.95, 0.09]}
        fontSize={0.09}
        anchorX="center"
        anchorY="middle"
        color="#ffffff99"
      >
        {`${project.category} • ${project.year}`}
      </Text>
    </group>
  );
}
