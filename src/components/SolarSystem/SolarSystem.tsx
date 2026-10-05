"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, useTexture, Line } from "@react-three/drei";
import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { projects, type Project } from "@/data/projects";
import ProjectCard from "@/components/Projects/ProjectCard";

// 1. The Fixed Sun (Using meshBasicMaterial so it is never dark on any side)
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

    const handleCanPlay = () => {
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      setVideoTexture(texture);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.play().catch(() => console.log("Autoplay prevented"));

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
        <meshBasicMaterial map={videoTexture} toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#FFCC66" />
      )}
    </mesh>
  );
}

// 2. Individual Project Card (Fixed to a specific spot on the spiral track)
function Planet({ project, index }: { project: Project; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(project.image) as THREE.Texture;
  const [hovered, setHovered] = useState(false);

  // Math for placing the card on the DNA Helix
  const angle = index * (Math.PI / 1.5); // Spaced evenly around the circle
  const radius = 6.5; // Distance from the sun
  const yPos = index * 4.5; // Staggered vertically by 4.5 units

  useFrame(({ camera }) => {
    if (!meshRef.current) return;

    // Cards must always pivot to face the user's camera
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
      position={[Math.cos(angle) * radius, yPos, Math.sin(angle) * radius]}
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
        const customProject = project as Project & { url?: string };
        if (customProject.url) window.open(customProject.url, "_blank");
      }}
    >
      <planeGeometry args={[3.5, 2.2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={hovered ? 1 : 0.85}
      />
      <Text
        position={[0, -1.4, 0.1]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {project.title}
      </Text>
    </mesh>
  );
}

// 3. The Chaining Helix System (Moves as a single unit when scrolled)
function HelixSystem({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Create a smooth spiral line to act as the track
  const helixPoints = [];
  const totalHeight = projects.length * 4.5;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const angle = t * projects.length * (Math.PI / 1.5);
    const y = t * totalHeight;
    helixPoints.push(
      new THREE.Vector3(Math.cos(angle) * 6.5, y, Math.sin(angle) * 6.5),
    );
  }

  useFrame(() => {
    if (!groupRef.current) return;
    const progress = scrollRef.current;

    // 1. Spin the entire helix as we scroll
    groupRef.current.rotation.y = progress * Math.PI * 4;

    // 2. Slide the entire helix downward
    // Starts high (Y=8) so card 0 is out of view.
    // Ends low so the last card passes the camera.
    const startY = 8;
    const endY = -totalHeight - 8;
    groupRef.current.position.y = THREE.MathUtils.lerp(startY, endY, progress);
  });

  return (
    <group ref={groupRef}>
      <Line points={helixPoints} color="rgba(255,255,255,0.2)" lineWidth={1} />
      {projects.map((project, i) => (
        <Planet key={project.id} project={project} index={i} />
      ))}
    </group>
  );
}

// 4. Main Scene & Scroll Constraints
export default function SolarSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Generous scroll height so users can comfortably scroll through all projects
    const scrollHeight = projects.length * 150;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${scrollHeight}%`,
      scrub: 1,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="projects" className="relative bg-black">
      {/* 3D WebGL Carousel with STRICT full-screen boundaries */}
      <div
        ref={containerRef}
        className="hidden lg:block relative"
        style={{ height: `${projects.length * 150}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-black absolute inset-0">
          <Canvas
            camera={{ position: [0, 2, 12], fov: 45 }}
            style={{ width: "100vw", height: "100vh", display: "block" }}
          >
            <ambientLight intensity={1} />
            <group rotation={[Math.PI / 12, 0, 0]}>
              <Sun />
              <Suspense fallback={null}>
                <HelixSystem scrollRef={scrollProgressRef} />
              </Suspense>
            </group>
          </Canvas>
        </div>
      </div>

      {/* Mobile 2D Fallback */}
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
