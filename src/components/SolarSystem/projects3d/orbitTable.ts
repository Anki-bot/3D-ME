"use client";

export interface OrbitParams {
  /** Ellipse semi-axis along X */
  rx: number;
  /** Ellipse semi-axis along Z */
  rz: number;
  /** Vertical offset of the orbital plane */
  y: number;
  /** Cinematic tilt around X for the ring group */
  tiltX: number;
  /** Cinematic tilt around Z for the ring group */
  tiltZ: number;
}

/**
 * One table drives both the visible <Line> rings and the card positions,
 * so every card sits exactly on its ring. Rings widen and alternate tilt
 * sign for a cinematic 3D perspective.
 */
export const ORBIT_TABLE: OrbitParams[] = Array.from(
  { length: 8 },
  (_, i) => ({
    rx: 4.2 + i * 0.55,
    rz: 2.6 + i * 0.4,
    y: (i % 3 - 1) * 0.45,
    tiltX: (i % 2 === 0 ? 1 : -1) * (0.32 + (i % 3) * 0.04),
    tiltZ: (i % 2 === 0 ? -1 : 1) * 0.12,
  })
);

export function orbitForIndex(index: number): OrbitParams {
  return ORBIT_TABLE[index % ORBIT_TABLE.length];
}
