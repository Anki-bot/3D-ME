"use client";

import {
  MutableRefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { projects } from "@/data/projects";
import SunAnchor from "./SunAnchor";
import ProjectOrbitCard from "./ProjectOrbitCard";
import { orbitForIndex } from "./orbitTable";

const RING_SEGMENTS = 128;
const FIXED_CAMERA_POSITION: [number, number, number] = [0, 2.5, 10];

function OrbitRing({ index }: { index: number }) {
  const orbit = orbitForIndex(index);
  const points = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: RING_SEGMENTS + 1 }, (_, s) => {
        const a = (s / RING_SEGMENTS) * Math.PI * 2;
        return [
          Math.cos(a) * orbit.rx,
          orbit.y,
          Math.sin(a) * orbit.rz,
        ] as [number, number, number];
      }),
    [orbit.rx, orbit.rz, orbit.y]
  );

  return (
    <group rotation={[orbit.tiltX, 0, orbit.tiltZ]}>
      <Line points={points} lineWidth={1} transparent opacity={0.25} />
    </group>
  );
}

function Starfield() {
  return (
    <points>
      <sphereGeometry args={[30, 32, 32]} />
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Quantizes scroll progress into per-project steps under reduced motion
 * (snap steps instead of continuous orbital sweep).
 */
function ProgressQuantizer({
  progressRef,
  displayRef,
  total,
  quantize,
}: {
  progressRef: MutableRefObject<number>;
  displayRef: MutableRefObject<number>;
  total: number;
  quantize: boolean;
}) {
  useFrame(() => {
    const t = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    displayRef.current = quantize
      ? Math.min(Math.floor(t * total), total - 1) / total
      : t;
  });
  return null;
}

export default function SolarCarouselScene({
  progressRef,
  hoveredRef,
  quantizeMotion,
  onError,
}: {
  progressRef: MutableRefObject<number>;
  hoveredRef: MutableRefObject<number | null>;
  quantizeMotion: boolean;
  onError?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const displayRef = useRef(0);
  const errorRef = useRef(onError);
  errorRef.current = onError;

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    let isIntersecting = true;
    let isDocumentVisible =
      typeof document === "undefined" ||
      document.visibilityState === "visible";
    const update = () => {
      visibleRef.current = isIntersecting && isDocumentVisible;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        update();
      },
      { threshold: 0 }
    );
    observer.observe(element);

    const handleVisibilityChange = () => {
      isDocumentVisible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const canvas = element.querySelector("canvas");
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      errorRef.current?.();
    };
    canvas?.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      observer.disconnect();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      canvas?.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, []);

  return (
    <div ref={wrapRef} className="orbit-carousel-wrap absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: FIXED_CAMERA_POSITION,
        }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl, camera }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          // Fixed camera: aimed once at the sun, never animated per-frame.
          camera.lookAt(0, 0, 0);
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight
            position={[0, 0, 0]}
            intensity={3}
            color="#FFAA33"
            distance={30}
          />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <SunAnchor position={[0, 0, 0]} />
          {projects.map((_, i) => (
            <OrbitRing key={`orbit-${i}`} index={i} />
          ))}
          {projects.map((project, i) => (
            <ProjectOrbitCard
              key={project.id}
              project={project}
              index={i}
              total={projects.length}
              progressRef={displayRef}
              hoveredRef={hoveredRef}
              orbit={orbitForIndex(i)}
              visibilityRef={visibleRef}
            />
          ))}
          <ProgressQuantizer
            progressRef={progressRef}
            displayRef={displayRef}
            total={projects.length}
            quantize={quantizeMotion}
          />
          <Starfield />
        </Suspense>
      </Canvas>
    </div>
  );
}
