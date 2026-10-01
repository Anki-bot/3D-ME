"use client";

import {
  MutableRefObject,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { projects } from "@/data/projects";
import SunNode from "./SunAnchor";
import ProjectOrbitCard from "./ProjectOrbitCard";
import { SHARED_ORBIT } from "./orbitTable";

const RING_SEGMENTS = 128;
const FIXED_CAMERA_POSITION: [number, number, number] = [0, 2, 8];
const MAX_CONTEXT_RETRIES = 2;
// Troika (drei <Text>) fetches its default font from a CDN at runtime.
const TROIKA_CDN_ORIGIN = "https://fonts.gstatic.com";

// NOTE: troika loads its bundled default font; preconnect to the font
// origin so first paint of labels is fast. No-op when offline.
function useFontPreconnect() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = TROIKA_CDN_ORIGIN;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function OrbitRing() {
  const points = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: RING_SEGMENTS + 1 }, (_, s) => {
        const a = (s / RING_SEGMENTS) * Math.PI * 2;
        return [
          Math.cos(a) * SHARED_ORBIT.radius,
          0,
          Math.sin(a) * SHARED_ORBIT.radius,
        ] as [number, number, number];
      }),
    []
  );

  return (
    <group rotation={SHARED_ORBIT.tilt}>
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
  const [remountKey, setRemountKey] = useState(0);
  const retriesRef = useRef(0);
  const errorRef = useRef(onError);
  errorRef.current = onError;

  useFontPreconnect();

  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    if (retriesRef.current >= MAX_CONTEXT_RETRIES) {
      errorRef.current?.();
    }
    // Otherwise wait for `webglcontextrestored`, which remounts below.
  }, []);

  const handleContextRestored = useCallback(() => {
    if (retriesRef.current < MAX_CONTEXT_RETRIES) {
      retriesRef.current += 1;
      setRemountKey((k) => k + 1);
    } else {
      errorRef.current?.();
    }
  }, []);

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

    return () => {
      observer.disconnect();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  return (
    <div ref={wrapRef} className="orbit-carousel-wrap absolute inset-0">
      <Canvas
        key={remountKey}
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
          // Fixed camera: aimed once, never animated per-frame.
          camera.lookAt(0, 0, 0);
          // The canvas is guaranteed to exist here — unlike querying the
          // DOM at effect time — so context events are never missed.
          gl.domElement.addEventListener(
            "webglcontextlost",
            handleContextLost
          );
          gl.domElement.addEventListener(
            "webglcontextrestored",
            handleContextRestored
          );
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight
          position={[0, 0, 0]}
          intensity={3}
          color="#FFAA33"
          distance={30}
        />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        {/* Sun + rings never suspend: a stalled font fetch can't blank them. */}
        <Suspense fallback={null}>
          <SunNode position={[0, 0, 0]} />
          <OrbitRing />
        </Suspense>
        {/* Each card suspends independently (textures + troika font), so one
            slow asset can never blank the whole scene. */}
        {projects.map((project, i) => (
          <Suspense key={project.id} fallback={null}>
            <ProjectOrbitCard
              project={project}
              index={i}
              total={projects.length}
              progressRef={displayRef}
              hoveredRef={hoveredRef}
              orbit={SHARED_ORBIT}
              visibilityRef={visibleRef}
            />
          </Suspense>
        ))}
        <ProgressQuantizer
          progressRef={progressRef}
          displayRef={displayRef}
          total={projects.length}
          quantize={quantizeMotion}
        />
        <Starfield />
      </Canvas>
    </div>
  );
}
