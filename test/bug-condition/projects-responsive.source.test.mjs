import assert from "node:assert/strict";
import test from "node:test";
import {
  PINNED_PROJECT_MEDIA_QUERY,
  PINNED_PROJECT_MIN_HEIGHT,
  PINNED_PROJECT_MIN_WIDTH,
  PROJECT_MODE_SERVER_FALLBACK,
  selectProjectMode,
} from "../../src/components/Projects/useProjectMode.ts";
import { read, readJson } from "./audit-model.mjs";

const projectsSource = read("src/components/Projects/Projects.tsx");
const modeSource = read("src/components/Projects/useProjectMode.ts");
const scrollSource = read("src/hooks/scroll/useProjectsScroll.ts");

/**
 * Property 1: Bug Condition - narrow and short project layouts use reachable flow.
 * **Validates: Requirements 1.7, 2.7**
 */
test("project mode has an SSR-safe flow fallback and deterministic width/height boundary", () => {
  assert.equal(PROJECT_MODE_SERVER_FALLBACK, "flow");
  assert.equal(PINNED_PROJECT_MIN_WIDTH, 1024);
  assert.equal(PINNED_PROJECT_MIN_HEIGHT, 720);
  assert.equal(
    PINNED_PROJECT_MEDIA_QUERY,
    "(min-width: 1024px) and (min-height: 720px)",
  );

  assert.equal(selectProjectMode({ width: 320, height: 568 }), "flow");
  assert.equal(selectProjectMode({ width: 844, height: 390 }), "flow");
  assert.equal(selectProjectMode({ width: 768, height: 1024 }), "flow");
  assert.equal(selectProjectMode({ width: 1024, height: 719 }), "flow");
  assert.equal(selectProjectMode({ width: 1023, height: 720 }), "flow");
  assert.equal(selectProjectMode({ width: 1024, height: 720 }), "pinned");
  assert.equal(selectProjectMode({ width: 1440, height: 1000 }), "pinned");

  assert.match(modeSource, /useSyncExternalStore\(subscribe, getClientSnapshot, getServerSnapshot\)/);
  assert.match(modeSource, /mediaQuery\.addEventListener\("change", onStoreChange\)/);
  assert.match(modeSource, /onStoreChange\(\)/);
  assert.match(modeSource, /mediaQuery\.removeEventListener\("change", onStoreChange\)/);
  assert.match(projectsSource, /section\.dataset\.projectHydrated = "true"/);
  assert.match(projectsSource, /delete section\.dataset\.projectHydrated/);
});

/**
 * Property 1 and Property 2: one flow branch fixes clipping while one pinned branch
 * preserves the audited desktop sequence.
 * **Validates: Requirements 1.7, 2.7, 3.4, 3.5, 3.6, 3.8, 3.10**
 */
test("Projects renders exactly one responsive content branch and gates pinned scrolling", () => {
  const pinnedStart = projectsSource.indexOf('data-project-mode="pinned"');
  const flowStart = projectsSource.indexOf('data-project-mode="flow"');

  assert.ok(pinnedStart >= 0 && flowStart > pinnedStart);
  assert.match(projectsSource, /isPinnedMode \? \(/);
  assert.equal((projectsSource.match(/<ProjectShowcase\b/g) ?? []).length, 1);
  assert.equal((projectsSource.match(/<ProjectCard\b/g) ?? []).length, 1);
  assert.match(projectsSource, /projects\.map\(\(project\) => \(/);
  assert.match(projectsSource, /enabled: isPinnedMode/);

  const pinnedBranch = projectsSource.slice(pinnedStart, flowStart);
  const flowBranch = projectsSource.slice(flowStart);

  assert.match(pinnedBranch, /height: `\$\{projects\.length \* 100\}vh`/);
  assert.match(pinnedBranch, /sticky top-0 h-screen overflow-hidden/);
  assert.match(pinnedBranch, /project=\{projects\[activeProject\]\}/);
  assert.doesNotMatch(flowBranch, /h-screen|overflow-hidden|height:\s*`\$\{projects\.length/);
  assert.match(flowBranch, /flex flex-col gap-24/);

  assert.match(scrollSource, /if \(!enabled \|\| !container\.current \|\| projectCount <= 0\) return/);
  assert.match(scrollSource, /\[enabled, projectCount\]/);
  assert.match(scrollSource, /Math\.floor\(self\.progress \* projectCount \+ 0\.25\)/);
  assert.match(scrollSource, /Math\.max\([\s\S]*?0,[\s\S]*?Math\.min/);
  assert.match(scrollSource, /projectCount - 1/);
});

/** Validates: Requirements 2.7, 3.10 */
test("focused project mode regressions are deterministic non-watch commands", () => {
  const pkg = readJson("package.json");

  assert.equal(
    pkg.scripts["test:bug:projects-source"],
    "node --test test/bug-condition/projects-responsive.source.test.mjs",
  );
  assert.equal(
    pkg.scripts["test:bug:projects-property"],
    'node --test --test-name-pattern="Property 1 keeps project content reachable" test/bug-condition/property.test.mjs',
  );
  assert.equal(
    pkg.scripts["test:bug:projects-browser"],
    "node test/bug-condition/projects-responsive.browser.mjs",
  );

  for (const command of [
    pkg.scripts["test:bug:projects-source"],
    pkg.scripts["test:bug:projects-property"],
    pkg.scripts["test:bug:projects-browser"],
  ]) {
    assert.doesNotMatch(command, /--watch/);
  }

  const runner = read("test/bug-condition/run-all.mjs");
  assert.match(runner, /test:bug:projects-source/);
  assert.match(runner, /test:bug:projects-browser/);
});
