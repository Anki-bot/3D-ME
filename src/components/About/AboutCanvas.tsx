"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Ring() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.15;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 3, 0, 0]}>
      <torusGeometry args={[1.1, 0.02, 16, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
    </mesh>
  );
}

export default function AboutCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))}
    >
      <ambientLight intensity={0.8} />
      <Ring />
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial roughness={0.2} transmission={0.5} thickness={0.5} color="#ffffff" transparent opacity={0.85} />
      </mesh>
    </Canvas>
  );
}
