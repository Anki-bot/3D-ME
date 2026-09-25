import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "../..");

export function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

export function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

export function maximumIntersectionRatio(sectionHeight, viewportHeight) {
  return Math.min(sectionHeight, viewportHeight) / sectionHeight;
}

export function currentEligibilityResult(input) {
  const eligible =
    input.finePointer &&
    input.hover &&
    !input.reducedMotion &&
    input.responsiveVisible &&
    input.elementVisible &&
    input.documentVisible;
  return {
    customCursorRunning: eligible,
    lenisRunning: eligible,
    parallaxRunning: eligible,
    infiniteAnimationRunning: eligible,
    nativeCursorVisible: !eligible,
    eligible,
  };
}

export function expectedEligibility(input) {
  return (
    input.finePointer &&
    input.hover &&
    !input.reducedMotion &&
    input.responsiveVisible &&
    input.elementVisible &&
    input.documentVisible
  );
}

export function currentResourceCountAfter(sequence) {
  let mounted = false;
  let eligible = false;
  for (const event of sequence) {
    if (event === "mount") mounted = true;
    if (event === "eligible") eligible = true;
    if (event === "ineligible") eligible = false;
    if (event === "unmount") mounted = false;
  }
  return mounted && eligible ? 1 : 0;
}

export function expectedResourceCountAfter(sequence) {
  let mounted = false;
  let eligible = false;
  for (const event of sequence) {
    if (event === "mount") mounted = true;
    if (event === "eligible") eligible = true;
    if (event === "ineligible") eligible = false;
    if (event === "unmount") mounted = false;
  }
  return mounted && eligible ? 1 : 0;
}

export function xorshift(seed = 0x5eed1234) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}
