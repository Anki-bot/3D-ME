"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function SunAnchor({
  position = [0, 0, 0] as [number, number, number],
}: {
  position?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedRef.current = query.matches;
    const handleChange = (event: MediaQueryListEvent) => {
      reducedRef.current = event.matches;
    };
    query.addEventListener("change", handleChange);
    return () => {
      query.removeEventListener("change", handleChange);
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
    meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group position={position}>
      {/* Core sun */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshStandardMaterial
          emissive="#FFAA33"
          emissiveIntensity={2.5}
          color="#FFCC66"
          roughness={0.8}
        />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color="#FFAA33" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial color="#FF7700" transparent opacity={0.08} />
      </mesh>
      {/* Corona particles */}
      <points>
        <sphereGeometry args={[1.4, 32, 32]} />
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
