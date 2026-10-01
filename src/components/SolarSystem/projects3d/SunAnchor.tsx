"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SUN_VIDEO_SRC = "/videos/sun.mp4";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SunNode — the central sun as a WebGL VideoTexture sphere.
 * No HTML <video> overlay: the mp4 is loaded via document.createElement
 * and piped into THREE.VideoTexture on a sphere at the origin.
 */
export default function SunNode({
  position = [0, 0, 0] as [number, number, number],
}: {
  position?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [videoTexture, setVideoTexture] =
    useState<THREE.VideoTexture | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedRef.current = query.matches;
    const handleReducedChange = (event: MediaQueryListEvent) => {
      reducedRef.current = event.matches;
    };
    query.addEventListener("change", handleReducedChange);

    let disposed = false;
    const video = document.createElement("video");
    video.src = SUN_VIDEO_SRC;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    let texture: THREE.VideoTexture | null = null;

    const tryPlay = () => {
      video.play().catch(() => undefined);
    };

    const handleCanPlay = () => {
      if (disposed) return;
      texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      setVideoTexture(texture);
      tryPlay();
    };

    // Autoplay-policy fallback: one user gesture retries playback.
    const handleFirstGesture = () => {
      tryPlay();
    };

    const cleanupVideo = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    video.addEventListener("canplay", handleCanPlay);
    window.addEventListener("pointerdown", handleFirstGesture);
    video.load();

    return () => {
      disposed = true;
      video.removeEventListener("canplay", handleCanPlay);
      window.removeEventListener("pointerdown", handleFirstGesture);
      query.removeEventListener("change", handleReducedChange);
      cleanupVideo();
      if (texture) texture.dispose();
      setVideoTexture((current) => {
        if (current && current !== texture) current.dispose();
        return null;
      });
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (reducedRef.current) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    )
      return;
    meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group position={position}>
      {videoTexture ? (
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        </mesh>
      ) : (
        // Emissive placeholder so the canvas is never empty pre-canplay.
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshStandardMaterial
            emissive="#FFAA33"
            emissiveIntensity={2.5}
            color="#FFCC66"
            roughness={0.8}
          />
        </mesh>
      )}
      {/* Glow shells */}
      <mesh>
        <sphereGeometry args={[1.75, 32, 32]} />
        <meshBasicMaterial color="#FFAA33" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial color="#FF7700" transparent opacity={0.08} />
      </mesh>
      {/* Corona particles */}
      <points>
        <sphereGeometry args={[2.1, 32, 32]} />
        <pointsMaterial
          size={0.015}
          color="#FFAA33"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
