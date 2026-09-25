export const hero3dConfig = {
  enabled: true,
  dpr: [1, 1.5] as [number, number],
  camera: {
    fov: 45,
    position: [0, 0, 4] as [number, number, number],
  },
  geometry: {
    type: "icosahedron" as const,
    args: [1.2, 2] as [number, number],
  },
  material: {
    roughness: 0.15,
    transmission: 0.6,
    thickness: 0.8,
    clearcoat: 1,
    metalness: 0.1,
  },
  motion: {
    rotationSpeed: 0.15,
    parallaxRange: 0.5,
    scrollRange: 0.3,
  },
  gl: {
    antialias: false,
    powerPreference: "high-performance" as const,
  },
} as const;

export type Hero3DConfig = typeof hero3dConfig;

export function selectHero3DEligibility(input: {
  finePointer: boolean;
  hover: boolean;
  reducedMotion: boolean;
  responsiveVisible: boolean;
  elementVisible: boolean;
  documentVisible: boolean;
  flagEnabled: boolean;
}): boolean {
  return (
    input.flagEnabled &&
    input.finePointer &&
    input.hover &&
    !input.reducedMotion &&
    input.responsiveVisible &&
    input.elementVisible &&
    input.documentVisible
  );
}
