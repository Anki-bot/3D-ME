"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, useTexture, Line } from "@react-three/drei";
import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { projects, type Project } from "@/data/projects";
import ProjectCard from "@/components/Projects/ProjectCard";

// 1. The Central Sun (Using safe DOM video loading & event listeners)
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null,
  );

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/videos/sun.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = "Anonymous";

    // Fix: Wait for video to be ready before setting state to appease the linter
    const handleCanPlay = () => {
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      setVideoTexture(texture);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.play().catch(() => console.log("Autoplay prevented by browser"));

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.pause();
      setVideoTexture((current) => {
        if (current) current.dispose();
        return null;
      });
    };
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      {videoTexture ? (
        <meshBasicMaterial map={videoTexture} />
      ) : (
        <meshStandardMaterial
          emissive="#FFAA33"
          emissiveIntensity={2.5}
          color="#FFCC66"
        />
      )}
    </mesh>
  );
}

// 2. The Orbiting Project Cards
// Fix: Use strict Project type instead of 'any'
function Planet({
  project,
  index,
  total,
  scrollRef,
}: {
  project: Project;
  index: number;
  total: number;
  scrollRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Fix: Explicitly cast to THREE.Texture
  const texture = useTexture(project.image) as THREE.Texture;
  const [hovered, setHovered] = useState(false);

  useFrame(({ camera }) => {
    if (!meshRef.current) return;

    // Orbital Math: Base position + Scroll offset
    const baseAngle = (index / total) * Math.PI * 2;
    const scrollAngle = scrollRef.current * Math.PI * 2;
    const finalAngle = baseAngle + scrollAngle;
    const radius = 6.5;

    // Move along the X and Z axis around the sun
    meshRef.current.position.x = Math.cos(finalAngle) * radius;
    meshRef.current.position.z = Math.sin(finalAngle) * radius;

    // Cards always face the fixed camera
    meshRef.current.lookAt(camera.position);

    // Smooth hover scale
    const targetScale = hovered ? 1.1 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={() => {
        // Fallback for custom URL property without using 'any'
        const customProject = project as Project & { url?: string };
        if (customProject.url) window.open(customProject.url, "_blank");
      }}
    >
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={hovered ? 1 : 0.85}
      />
      <Text
        position={[0, -1.3, 0.1]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {project.title}
      </Text>
    </mesh>
  );
}

// 3. Scene Composition
function OrbitalScene({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<number>;
}) {
  // Generate points for the visible orbital ring
  const ringPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    ringPoints.push(
      new THREE.Vector3(Math.cos(angle) * 6.5, 0, Math.sin(angle) * 6.5),
    );
  }

  return (
    // Tilt the entire solar system slightly for a cinematic 3D perspective
    <group rotation={[Math.PI / 10, 0, 0]}>
      <ambientLight intensity={1} />
      <Sun />
      <Line points={ringPoints} color="rgba(255,255,255,0.15)" lineWidth={1} />

      <Suspense fallback={null}>
        {projects.map((project, i) => (
          <Planet
            key={project.id}
            project={project}
            index={i}
            total={projects.length}
            scrollRef={scrollRef}
          />
        ))}
      </Suspense>
    </group>
  );
}

// 4. Main Container & ScrollTrigger
export default function SolarSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Track scroll progress through the 300vh container
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="projects" className="relative bg-black">
      {/* Desktop 3D WebGL Carousel */}
      <div
        ref={containerRef}
        className="hidden lg:block relative"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
          <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
            <OrbitalScene scrollRef={scrollProgressRef} />
          </Canvas>
        </div>
      </div>

      {/* Mobile 2D Fallback View */}
      {/* Fix: use max-w-7xl instead of arbitrary brackets */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pb-32 lg:hidden">
        <div className="flex flex-col gap-24 sm:gap-32">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold text-white">Selected Work</h2>
          </div>
          {projects.map((project) => (
            <ProjectCard key={`fallback-${project.id}`} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
