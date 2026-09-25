"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { projects } from "@/data/projects";
import { useProjectsScroll } from "@/hooks/scroll/useProjectsScroll";

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15;
  });
  return (
    <group>
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
        <pointsMaterial size={0.015} color="#FFAA33" transparent opacity={0.4} sizeAttenuation />
      </points>
    </group>
  );
}

function Orbit({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.01, radius + 0.01, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Planet({
  index,
  progress,
  activeProject,
}: {
  index: number;
  progress: number;
  activeProject: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isActive = index === activeProject;
  const radius = 2.2 + index * 1.1;
  const speed = 0.6 - index * 0.12; // outer slower
  const color = ["#6B7280", "#60A5FA", "#FACC15"][index] || "#fff";

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const auto = delta * 0.1;
    groupRef.current.rotation.z += auto;
  });

  const angle = progress * Math.PI * 2 * speed + index * ((Math.PI * 2) / 3);

  return (
    <group ref={groupRef} rotation={[0, 0, angle]}>
      <group position={[radius, 0, 0]}>
        <mesh scale={isActive ? 1.3 : 1}>
          <sphereGeometry args={[0.28 + (isActive ? 0.08 : 0), 32, 32]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.3}
            emissive={isActive ? color : "#000000"}
            emissiveIntensity={isActive ? 0.4 : 0}
          />
        </mesh>
        {/* Ring for outer planets */}
        {index === 1 && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.42, 32]} />
            <meshBasicMaterial color="#60A5FA" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Label */}
        <group position={[0, 0.6, 0]}>
          {/* Text via sprite would need texture, keep simple */}
        </group>
      </group>
    </group>
  );
}

function SolarScene({
  progress,
  activeProject,
}: {
  progress: number;
  activeProject: number;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#FFAA33" distance={10} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <Sun />
      {[0, 1, 2].map((i) => (
        <Orbit key={`orbit-${i}`} radius={2.2 + i * 1.1} color={["#FFFFFF", "#60A5FA", "#FACC15"][i]} />
      ))}
      {projects.map((_, i) => (
        <Planet key={`planet-${i}`} index={i} progress={progress} activeProject={activeProject} />
      ))}
      {/* Starfield */}
      <points>
        <sphereGeometry args={[12, 32, 32]} />
        <pointsMaterial size={0.015} color="#ffffff" transparent opacity={0.6} sizeAttenuation />
      </points>
    </>
  );
}

export default function SolarCanvas({
  activeProject,
  onProjectChange,
  containerRef,
}: {
  activeProject: number;
  onProjectChange: (i: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const progressRef = useRef(0);

  useProjectsScroll({
    container: containerRef,
    enabled: true,
    projectCount: projects.length,
    onProjectChange: (idx) => {
      progressRef.current = idx / (projects.length - 1 || 1);
      onProjectChange(idx);
    },
  });

  // Also track smooth progress via ScrollTrigger progress
  // For now use activeProject to derive progress
  const progress = activeProject / (projects.length - 1 || 1);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 5, 9], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))}
        style={{ background: "transparent" }}
      >
        <SolarScene progress={progress} activeProject={activeProject} />
      </Canvas>
    </div>
  );
}
