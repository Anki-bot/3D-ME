"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Icosahedron } from "@react-three/drei";
import * as THREE from "three";
import { hero3dConfig } from "@/config/hero3d";

export default function Hero3DScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Slow rotation gated by visibility (parent Canvas handles frameloop pause)
    mesh.rotation.y += hero3dConfig.motion.rotationSpeed * delta;
    mesh.rotation.x += hero3dConfig.motion.rotationSpeed * 0.5 * delta;

    // Mouse parallax
    const pointer = state.pointer;
    mesh.position.x = pointer.x * hero3dConfig.motion.parallaxRange;
    mesh.position.y = pointer.y * hero3dConfig.motion.parallaxRange * 0.5;

    // Scroll-driven offset (simple: based on scrollY)
    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight * 0.5;
    const progress = Math.min(scrollY / maxScroll, 1);
    mesh.position.y -= progress * hero3dConfig.motion.scrollRange;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <Icosahedron ref={meshRef} args={hero3dConfig.geometry.args}>
        <meshPhysicalMaterial
          ref={materialRef}
          roughness={hero3dConfig.material.roughness}
          transmission={hero3dConfig.material.transmission}
          thickness={hero3dConfig.material.thickness}
          clearcoat={hero3dConfig.material.clearcoat}
          metalness={hero3dConfig.material.metalness}
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </Icosahedron>
    </>
  );
}
