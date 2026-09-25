export const projects3dConfig = {
  enabled: true,
  dpr: [1, 1.5] as [number, number],
  shader: {
    uProgress: 0,
    uDirection: 1,
    duration: 0.9,
    ease: "power3.out",
  },
  material: {
    displacement: 0.05,
  },
} as const;

export function selectProjects3DEligibility(input: {
  isPinnedMode: boolean;
  finePointer: boolean;
  hover: boolean;
  reducedMotion: boolean;
  elementVisible: boolean;
  documentVisible: boolean;
  flagEnabled: boolean;
}): boolean {
  return (
    input.flagEnabled &&
    input.isPinnedMode &&
    input.finePointer &&
    input.hover &&
    !input.reducedMotion &&
    input.elementVisible &&
    input.documentVisible
  );
}
