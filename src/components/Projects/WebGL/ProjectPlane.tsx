"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface ProjectPlaneProps {
  image: string;
  progress: number;
  direction: number;
}

export default function ProjectPlane({ image, progress, direction }: ProjectPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image) as THREE.Texture;

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uProgress: { value: progress },
      uDirection: { value: direction },
    }),
    [texture, progress, direction]
  );

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uProgress.value = progress;
      mat.uniforms.uDirection.value = direction;
    }
  });

  // Ensure texture disposal handled by drei cache, but also dispose on unmount if needed
  // drei's useTexture caches; we rely on Canvas dispose

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 2.7, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          uniform float uProgress;
          uniform float uDirection;
          varying vec2 vUv;
          void main(){
            vUv = uv;
            vec3 pos = position;
            pos.x += sin(uv.y * 6.0 + uProgress * 6.28) * 0.05 * uDirection * uProgress;
            pos.z += cos(uv.x * 4.0 + uProgress * 3.14) * 0.02 * uProgress;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D uTexture;
          uniform float uProgress;
          varying vec2 vUv;
          void main(){
            vec4 color = texture2D(uTexture, vUv);
            float dist = distance(vUv, vec2(0.5));
            color.rgb += uProgress * 0.04 * (1.0 - dist);
            gl_FragColor = color;
          }
        `}
        transparent
      />
    </mesh>
  );
}
