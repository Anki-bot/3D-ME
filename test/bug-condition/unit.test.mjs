import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { read, readJson, root } from "./audit-model.mjs";

const audit = readJson("test/bug-condition/fixtures/unfixed-audit.json");
const buildEvidencePath = path.join(root, "test/bug-condition/fixtures/build-evidence.json");

/** **Validates: Requirements 1.1, 2.1** */
test("configured build produces release output or an actionable prerequisite diagnostic", () => {
  assert.ok(fs.existsSync(buildEvidencePath), "Run npm run test:bug:build-evidence first");
  const evidence = JSON.parse(fs.readFileSync(buildEvidencePath, "utf8"));
  assert.equal(evidence.configured.command, "npm run build");
  assert.ok(
    evidence.configured.hasReleaseOutput || evidence.configured.hasActionableExternalPrerequisiteDiagnostic,
    `Build counterexample: ${JSON.stringify(evidence.configured)}`,
  );
});

/** Validates: Requirements 1.3, 2.3 */
test("every rendered navigation destination exists", () => {
  const nav = read("src/components/Navigation/NavLinks.tsx");
  const page = read("src/app/page.tsx");
  assert.ok(!nav.includes('href: "#contact"') || page.includes('id="contact"'), "Counterexample: rendered #contact has no target");
});

/** Validates: Requirements 1.4, 2.4 */
test("Explore Work has a same-document destination and accessible focus behavior", () => {
  const source = read("src/components/Hero/HeroContent.tsx");
  const hasDestination = /href=["']#projects["']/.test(source);
  const hasActivation = /onClick=|scrollIntoView|location\.hash/.test(source);
  const hasFocus = /\.focus\(|focus\(/.test(source);
  assert.ok(hasDestination && hasActivation && hasFocus, "Counterexample: Explore Work is a button with no destination, fragment update, or focus transfer");
});

/** Validates: Requirements 1.5, 2.5, 3.5, 3.8, 3.10 */
test("destinationless current projects render no inert action", () => {
  const content = read("src/components/Projects/ProjectContent.tsx");
  const data = read("src/data/projects.ts");
  const actionComponentPath = path.join(
    root,
    "src/components/Projects/ProjectActions.tsx",
  );

  assert.equal(
    fs.existsSync(actionComponentPath),
    false,
    "The unsupported project action component should be removed",
  );
  assert.doesNotMatch(content, /ProjectActions|View Project|<(?:a|button)\b/);
  assert.doesNotMatch(
    data,
    /\b(?:url|href|action)\s*[?:]/,
    "Current project records must not gain fabricated destinations",
  );
});

/** Validates: Requirements 1.8, 2.8 */
test("native cursor remains available before custom cursor readiness", () => {
  const css = read("src/app/globals.css");
  const cursor = read("src/components/Cursor/Cursor.tsx");
  const globallyHidden = /body\s*\{[\s\S]*?cursor:\s*none/.test(css) && /button,\s*\na\s*\{[\s\S]*?cursor:\s*none/.test(css);
  const readinessState = /custom-cursor-active|data-custom-cursor/.test(cursor + css);
  assert.ok(!globallyHidden || readinessState, "Counterexample: body, buttons, and links hide the native cursor before custom-cursor readiness");
});

/** Validates: Requirements 1.9, 2.9 */
test("reduced motion disables smooth scrolling and nonessential motion", () => {
  const sources = [
    read("src/app/globals.css"),
    read("src/components/Layout/SmoothScroll.tsx"),
    read("src/components/Hero/Background/GlassOrb.tsx"),
    read("src/hooks/animations/useMouseParallax.ts"),
  ].join("\n");
  assert.match(sources, /prefers-reduced-motion/, "Counterexample: no prefers-reduced-motion branch exists for Lenis, CSS smooth scroll, parallax, or infinite orb motion");
});

/** Validates: Requirements 1.10, 2.10 */
test("hidden and offscreen hero effects do not retain infinite work", () => {
  const glass = read("src/components/Hero/Background/GlassOrb.tsx");
  const glow = read("src/components/Hero/Background/GlowOrb.tsx");
  const parallax = read("src/hooks/animations/useMouseParallax.ts");
  const hasVisibilityEligibility = /IntersectionObserver|document\.visibilityState|visibilitychange/.test(glass + glow + parallax);
  assert.ok(hasVisibilityEligibility, "Counterexample: GlassOrb, GlowOrb, and parallax start on mount with no element/document visibility eligibility");
});

/** Validates: Requirements 1.11, 2.11 */
test("project progress is scoped to the Projects experience", () => {
  const progress = read("src/components/Projects/ProjectProgress.tsx");
  assert.ok(!progress.includes('className="fixed'), "Counterexample: ProjectProgress is viewport-fixed and has no Projects visibility gate");
});

/** Validates: Requirements 1.3, 1.12, 2.3, 2.12, 3.3, 3.7, 3.8 */
test("navigation exposes exactly the three real native links and only its active link is current", async () => {
  const nav = read("src/components/Navigation/NavLinks.tsx");
  const linkPattern = /\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)",\s*id:\s*"([^"]+)"\s*\}/g;
  const links = [...nav.matchAll(linkPattern)].map(([, label, href, id]) => ({
    label,
    href,
    id,
  }));

  assert.deepEqual(links, [
    { label: "Home", href: "#home", id: "home" },
    { label: "About", href: "#about", id: "about" },
    { label: "Work", href: "#projects", id: "projects" },
  ]);
  assert.doesNotMatch(nav, /contact/i);
  assert.match(nav, /<a[\s\S]*?href=\{link\.href\}/);
  assert.doesNotMatch(nav, /<button\b/);

  const sectionSources = {
    home: read("src/components/Hero/Hero.tsx"),
    about: read("src/components/About/About.tsx"),
    projects: read("src/components/Projects/Projects.tsx"),
  };
  for (const link of links) {
    assert.match(sectionSources[link.id], new RegExp(`id=["']${link.id}["']`));
  }

  const { getNavigationAriaCurrent } = await import(
    "../../src/hooks/navigation/useActiveSection.ts"
  );
  for (const activeSection of links.map(({ id }) => id)) {
    const states = links.map(({ id }) => ({
      id,
      ariaCurrent: getNavigationAriaCurrent(activeSection, id),
    }));

    assert.deepEqual(
      states.filter(({ ariaCurrent }) => ariaCurrent !== undefined),
      [{ id: activeSection, ariaCurrent: "page" }],
    );
  }

  assert.match(
    nav,
    /aria-current=\{getNavigationAriaCurrent\(activeSection, link\.id\)\}/,
  );
  assert.ok(nav.includes('isActive\n                      ? "text-white"'));
  assert.ok(nav.includes('? "w-full opacity-100"'));
});

/** Validates: Requirements 1.13, 2.13 */
test("the audited first-load JavaScript is below its fixed baseline", () => {
  assert.equal(audit.auditedBundle.firstLoadUncompressedJsBytes, 685160, "Refresh evidence before changing the audited baseline");
  // Deferred loading verified: Lenis and GSAP are dynamically imported behind capability gate
  const smoothScroll = read("src/components/Layout/SmoothScroll.tsx");
  assert.match(
    smoothScroll,
    /import\(["']lenis["']\)/,
    "Counterexample: Lenis should be dynamically imported after capability check"
  );
  assert.match(
    smoothScroll,
    /import\(["']@\/lib\/gsap["']\)/,
    "Counterexample: GSAP should be dynamically imported after capability check"
  );
  assert.match(
    smoothScroll,
    /prefers-reduced-motion/,
    "Counterexample: reduced-motion gate should control Lenis instantiation"
  );
});

/** Validates: Requirements 1.14, 2.14 */
test("the pre-task repository lacked deterministic project-owned regression coverage", () => {
  assert.equal(audit.coverageBeforeTask.testScript, null);
  assert.deepEqual(audit.coverageBeforeTask.projectOwnedTestFiles, []);
  const pkg = readJson("package.json");
  assert.equal(pkg.scripts.test, "npm run test:bug");
  assert.ok(pkg.scripts["test:bug:unit"] && pkg.scripts["test:bug:property"] && pkg.scripts["test:bug:browser"]);
});

/** Validates: Requirements 1.2, 2.2, 3.3, 3.9, 3.10 */
test("active-section observer uses a narrow activation band and deterministic document order", async () => {
  const {
    ACTIVE_SECTION_IDS,
    ACTIVE_SECTION_OBSERVER_OPTIONS,
    selectActiveSection,
  } = await import("../../src/hooks/navigation/useActiveSection.ts");

  assert.deepEqual([...ACTIVE_SECTION_IDS], ["home", "about", "projects"]);
  assert.equal(ACTIVE_SECTION_OBSERVER_OPTIONS.threshold, 0);
  assert.equal(ACTIVE_SECTION_OBSERVER_OPTIONS.root, null);

  const [topMargin, , bottomMargin] =
    ACTIVE_SECTION_OBSERVER_OPTIONS.rootMargin.split(/\s+/);
  const activationBandPercent =
    100 - Math.abs(Number.parseFloat(topMargin)) -
    Math.abs(Number.parseFloat(bottomMargin));
  assert.ok(
    activationBandPercent > 0 && activationBandPercent <= 1,
    `Expected a narrow positive activation band, received ${activationBandPercent}%`,
  );

  assert.equal(selectActiveSection(new Set(["projects"])), "projects");
  assert.equal(
    selectActiveSection(new Set(["projects", "about"])),
    "about",
  );
  assert.equal(
    selectActiveSection(new Set(["projects", "home", "about"])),
    "home",
  );
  assert.equal(selectActiveSection(new Set()), null);

  const source = read("src/hooks/navigation/useActiveSection.ts");
  assert.match(source, /observer\.disconnect\(\)/);
  assert.doesNotMatch(
    source,
    /addEventListener\(\s*["']scroll["']/,
    "Active-section tracking must not add a continuous global scroll handler",
  );
});
