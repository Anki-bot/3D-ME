"use client";

export interface OrbitParams {
  /** Shared ring radius for every card */
  radius: number;
  /** Ring group tilt: [Math.PI / 8, 0, 0] cinematic perspective */
  tilt: [number, number, number];
}

/**
 * Single shared orbit: every card rides the same radius-5 ring.
 * Cards are distributed evenly by baseAngle; scroll adds a global
 * rotation. The ring mesh and card positions use this one source.
 */
export const SHARED_ORBIT: OrbitParams = {
  radius: 5,
  tilt: [Math.PI / 8, 0, 0],
};

export function orbitForIndex(): OrbitParams {
  return SHARED_ORBIT;
}
