export const PROJECTS_SECTION_ID = "projects";
export const PROJECTS_HEADING_ID = "projects-heading";
export const PROJECTS_FRAGMENT = `#${PROJECTS_SECTION_ID}`;
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type LinkActivation = Readonly<{
  button: number;
  defaultPrevented: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}>;

export function shouldHandleExploreWorkActivation(
  activation: LinkActivation,
): boolean {
  return (
    !activation.defaultPrevented &&
    activation.button === 0 &&
    !activation.altKey &&
    !activation.ctrlKey &&
    !activation.metaKey &&
    !activation.shiftKey
  );
}

export function getExploreWorkScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "instant" : "smooth";
}
