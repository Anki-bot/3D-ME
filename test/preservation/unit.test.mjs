import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  eventListenerBalance,
  extractSectionIds,
  jsxVisibleText,
  normalizeWhitespace,
  parseNavigationLinks,
  parseProjectRecords,
  read,
  readJson,
  readProductionSources,
  root,
  semanticProject,
} from "./preservation-model.mjs";

const baseline = readJson("test/preservation/fixtures/unfixed-preservation.json");

function assertTokens(source, tokens, label) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label} no longer contains ${JSON.stringify(token)}`);
  }
}

function extractGlowParameters(source) {
  return [...source.matchAll(/<GlowOrb\b([\s\S]*?)\/>/g)].map(([, attributes]) => ({
    x: Number(attributes.match(/\bx=\{(-?\d+(?:\.\d+)?)\}/)?.[1]),
    y: Number(attributes.match(/\by=\{(-?\d+(?:\.\d+)?)\}/)?.[1]),
    duration: Number(attributes.match(/\bduration=\{(-?\d+(?:\.\d+)?)\}/)?.[1]),
  }));
}

function animationBlock(source, name) {
  const start = source.indexOf(`const ${name} = gsap.to`);
  assert.notEqual(start, -1, `Missing ${name} animation`);
  const end = source.indexOf("});", start);
  assert.notEqual(end, -1, `Could not read ${name} animation`);
  return normalizeWhitespace(source.slice(start, end + 3));
}

/**
 * Property 2: Preservation - valid navigation remains equivalent.
 * **Validates: Requirements 3.3, 3.10**
 */
test("Property 2 records exact Home, About, and Work fragments with motion-capable smooth behavior", () => {
  const nav = read("src/components/Navigation/NavLinks.tsx");
  const validIds = new Set(baseline.validNavigation.map(({ id }) => id));
  const validLinks = parseNavigationLinks(nav).filter(({ id }) => validIds.has(id));
  assert.deepEqual(validLinks, baseline.validNavigation);

  const page = read("src/app/page.tsx");
  const renderedOrder = ["<Hero", "<About", "<Projects"].map((component) => page.indexOf(component));
  assert.ok(renderedOrder.every((index) => index >= 0));
  assert.deepEqual([...renderedOrder].sort((left, right) => left - right), renderedOrder);

  const sectionSources = {
    home: read("src/components/Hero/Hero.tsx"),
    about: read("src/components/About/About.tsx"),
    projects: read("src/components/Projects/Projects.tsx"),
  };
  const projectNavigation = read("src/lib/exploreWorkNavigation.ts");
  for (const destination of baseline.validNavigation) {
    if (destination.id === "projects") {
      assert.match(sectionSources.projects, /id=\{PROJECTS_SECTION_ID\}/);
      assert.match(
        projectNavigation,
        /PROJECTS_SECTION_ID\s*=\s*["']projects["']/,
      );
    } else {
      assert.match(
        sectionSources[destination.id],
        new RegExp(`id=["']${destination.id}["']`),
      );
    }
  }

  const css = read("src/app/globals.css");
  assert.match(css, /html\s*\{[\s\S]*?scroll-behavior:\s*smooth/);

  const smoothScroll = read("src/components/Layout/SmoothScroll.tsx");
  const { lenis } = baseline.smoothNavigation;
  assert.match(smoothScroll, new RegExp(`autoRaf:\\s*${lenis.autoRaf}`));
  assert.match(smoothScroll, new RegExp(`duration:\\s*${lenis.duration}`));
  assert.match(smoothScroll, new RegExp(`smoothWheel:\\s*${lenis.smoothWheel}`));
});

/**
 * Property 2: Preservation - semantic content remains equivalent.
 * **Validates: Requirements 3.5, 3.7, 3.8, 3.10**
 */
test("Property 2 locks section copy, project data, images, and project order without locking the inert action", () => {
  for (const section of baseline.sectionCopy) {
    for (const sourceContract of section.sources) {
      const visibleSource = jsxVisibleText(read(sourceContract.file));
      for (const value of sourceContract.values) {
        assert.ok(
          visibleSource.includes(normalizeWhitespace(value)),
          `${section.section} copy changed or disappeared: ${JSON.stringify(value)}`,
        );
      }
    }
  }

  const projects = parseProjectRecords(read("src/data/projects.ts"));
  assert.deepEqual(projects, baseline.projects);
  assert.deepEqual(projects.map(semanticProject), baseline.projects);
  assert.deepEqual(projects.map(({ id }) => id), [1, 2, 3]);

  for (const project of projects) {
    const imagePath = path.join(root, "public", project.image.replace(/^\//, ""));
    assert.ok(fs.existsSync(imagePath), `Missing preserved project image ${project.image}`);
  }

  assert.equal(baseline.projectActions.currentRecordsHaveDefinedActions, false);
  assert.match(baseline.projectActions.knownDefectExcluded, /task 1 bug-condition suite/i);
});

/**
 * Property 2: Preservation - eligible desktop storytelling remains equivalent.
 * **Validates: Requirements 3.4, 3.6, 3.8, 3.10**
 */
test("Property 2 records wide/tall ambience, sticky storytelling, hover, transition, and pointer parameters", () => {
  const { visuals } = baseline;
  assert.ok(visuals.eligibleViewport.width >= 1024 && visuals.eligibleViewport.height >= 720);
  assert.equal(visuals.eligibleViewport.motionAllowed, true);
  assert.equal(visuals.eligibleViewport.finePointer, true);

  assertTokens(read("src/components/Navigation/Navbar.tsx"), visuals.wideNavbarTokens, "wide navbar");

  const gradient = read("src/components/Hero/Background/GradientLayer.tsx");
  assert.deepEqual(extractGlowParameters(gradient), visuals.hero.glowOrbs);

  const glass = read("src/components/Hero/Background/GlassOrb.tsx");
  assertTokens(glass, visuals.hero.glassOrb.tokens, "glass orb");
  for (const [name, parameters] of Object.entries({
    floating: visuals.hero.glassOrb.floating,
    rotation: visuals.hero.glassOrb.rotation,
    breathing: visuals.hero.glassOrb.breathing,
  })) {
    const block = animationBlock(glass, name);
    for (const [property, value] of Object.entries(parameters)) {
      assert.ok(block.includes(`${property}: ${JSON.stringify(value)}`), `${name}.${property} changed`);
    }
  }

  const noise = read("src/components/Hero/Background/NoiseLayer.tsx");
  assert.ok(noise.includes(`white ${visuals.hero.noise.dotSizePx}px`));
  assert.ok(noise.includes(`backgroundSize: "${visuals.hero.noise.backgroundSize}"`));
  assert.ok(noise.includes(visuals.hero.noise.opacityToken));
  const particles = read("src/components/Hero/Background/Particles.tsx");
  assert.equal((particles.match(/h-1 w-1 rounded-full/g) ?? []).length, visuals.hero.particleCount);

  const projectsSource = read("src/components/Projects/Projects.tsx");
  assert.ok(projectsSource.includes(`height: \`\${projects.length * ${visuals.stickyProjectSequence.heightPerProjectVh}}vh\`,`));
  assertTokens(projectsSource, visuals.stickyProjectSequence.tokens, "sticky project viewport");
  assert.equal((projectsSource.match(/<ProjectShowcase\b/g) ?? []).length, 1);
  assert.match(projectsSource, /project=\{projects\[activeProject\]\}/);
  assert.match(projectsSource, /current=\{activeProject\}/);

  const scroll = read("src/hooks/scroll/useProjectsScroll.ts");
  assert.ok(scroll.includes(`start: "${visuals.stickyProjectSequence.scrollStart}"`));
  assert.ok(scroll.includes(`end: "${visuals.stickyProjectSequence.scrollEnd}"`));
  assert.match(scroll, /Math\.floor\(self\.progress \* projectCount \+ 0\.25\)/);
  assert.match(scroll, /projectCount - 1/);

  const transition = read("src/hooks/animations/useProjectTransition.ts");
  assert.ok(transition.includes(`activeProject % 2 === 0 ? 1 : -1`));
  assert.ok(transition.includes(`x: direction * ${visuals.projectTransition.imageOffset}`));
  assert.ok(transition.includes(`duration: ${visuals.projectTransition.containerDuration}`));
  assert.ok(transition.includes(`duration: ${visuals.projectTransition.imageDuration}`));
  assert.ok(transition.includes(`duration: ${visuals.projectTransition.contentDuration}`));
  assert.ok(transition.includes(`stagger: ${visuals.projectTransition.contentStagger}`));

  assertTokens(read("src/components/Hero/HeroContent.tsx"), visuals.hover.heroCtaTokens, "hero CTA hover");
  assertTokens(read("src/components/Projects/ProjectImage.tsx"), visuals.hover.projectImageTokens, "project image hover");

  const cursor = read("src/components/Cursor/Cursor.tsx");
  assert.ok(cursor.includes(`duration: ${visuals.pointer.cursorMoveDuration}`));
  assert.ok(cursor.includes(`scale: ${visuals.pointer.cursorInteractiveScale}`));
  assert.ok(cursor.includes(`duration: ${visuals.pointer.cursorScaleDuration}`));
  assert.ok(cursor.includes(visuals.pointer.interactiveSelector));

  const parallax = read("src/hooks/animations/useMouseParallax.ts");
  assert.ok(parallax.includes(`* ${visuals.pointer.heroParallaxRange}`));
  assert.ok(parallax.includes(`duration: ${visuals.pointer.heroParallaxDuration}`));

  const imageMotion = read("src/hooks/animations/useProjectImageAnimation.ts");
  assert.ok(imageMotion.includes(`x * ${visuals.pointer.projectContainerRange}`));
  assert.ok(imageMotion.includes(`x * ${visuals.pointer.projectImageRange}`));
});

/**
 * Property 2: Preservation - scope remains limited to the audited portfolio.
 * **Validates: Requirements 3.5, 3.7, 3.8, 3.10**
 */
test("Property 2 rejects Contact sections, changed section sets, 3D source features, and unrelated runtime dependencies", () => {
  const sources = readProductionSources();
  assert.deepEqual(extractSectionIds(sources).sort(), [...baseline.scopeGuards.allowedSectionIds].sort());

  const aggregate = Object.values(sources).join("\n");
  assert.doesNotMatch(aggregate, /<section\b[^>]*\bid\s*=\s*["']contact["']/i);
  // 3D allowed only via approved specs (hero + projects + about)
  const filteredFor3D = Object.entries(sources)
    .filter(
      ([filePath]) =>
        !filePath.includes("WebGLCanvas") &&
        !filePath.includes("Hero3DScene") &&
        !filePath.includes("hero3d") &&
        !filePath.includes("ProjectPlane") &&
        !filePath.includes("ProjectImage3D") &&
        !filePath.includes("projects3d") &&
        !filePath.includes("AboutOrb3D") &&
        !filePath.includes("AboutCanvas")
    )
    .map(([, content]) => content)
    .join("\n");
  assert.doesNotMatch(
    filteredFor3D,
    /(?:from\s+["'](?:@react-three\/[^"']+|three|leva)["']|import\s+["'](?:@react-three\/[^"']+|three|leva)["']|<Canvas\b|WebGLRenderer)/,
  );

  const packageJson = readJson("package.json");
  const allowed = new Set(baseline.scopeGuards.allowedRuntimeDependencies);
  const unexpected = Object.keys(packageJson.dependencies ?? {}).filter((dependency) => !allowed.has(dependency));
  assert.deepEqual(unexpected, [], `Unrelated runtime dependencies were added: ${unexpected.join(", ")}`);
});

/**
 * Property 2: Preservation - existing cleanup remains complete and repeatable.
 * **Validates: Requirements 3.9, 3.10**
 */
test("Property 2 records balanced listener, observer, Lenis, ticker, trigger, tween, context, and media-query cleanup", () => {
  const sources = readProductionSources();

  for (const owner of baseline.cleanup.eventListenerOwners) {
    const balance = eventListenerBalance(sources[owner]);
    assert.ok(balance.size > 0, `${owner} no longer exposes its observed listener lifecycle`);
    for (const [resource, counts] of balance) {
      assert.equal(counts.removed, counts.added, `${owner} leaks ${resource}: ${JSON.stringify(counts)}`);
    }
  }

  for (const owner of baseline.cleanup.observerOwners) {
    const source = sources[owner];
    const observers = [...source.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(?:Intersection|Resize|Mutation)Observer\b/g)];
    assert.ok(observers.length > 0, `${owner} no longer contains its observed observer`);
    for (const [, variable] of observers) assert.ok(source.includes(`${variable}.disconnect()`));
  }

  for (const owner of baseline.cleanup.lenisOwners) {
    const source = sources[owner];
    const variable = source.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Lenis\b/)?.[1];
    assert.ok(variable, `${owner} no longer contains its observed Lenis integration`);
    assert.ok(source.includes(`${variable}.destroy()`));
    for (const match of source.matchAll(new RegExp(`${variable}\\.on\\(\\s*["']([^"']+)["']\\s*,\\s*([A-Za-z_$][\\w$]*)`, "g"))) {
      assert.match(source, new RegExp(`${variable}\\.off\\(\\s*["']${match[1]}["']\\s*,\\s*${match[2]}`));
    }
  }

  for (const owner of baseline.cleanup.tickerOwners) {
    const source = sources[owner];
    const additions = [...source.matchAll(/([A-Za-z_$][\w$]*)\.ticker\.add\(\s*([A-Za-z_$][\w$]*)\s*\)/g)];
    assert.ok(additions.length > 0, `${owner} no longer contains its observed ticker integration`);
    for (const [, object, callback] of additions) assert.ok(source.includes(`${object}.ticker.remove(${callback})`));
  }

  for (const owner of baseline.cleanup.scrollTriggerOwners) {
    const source = sources[owner];
    const triggers = [...source.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*ScrollTrigger\.create\(/g)];
    assert.ok(triggers.length > 0, `${owner} no longer contains its observed ScrollTrigger`);
    for (const [, variable] of triggers) assert.ok(source.includes(`${variable}.kill()`));
  }

  for (const owner of baseline.cleanup.explicitTweenCleanupOwners) {
    const source = sources[owner];
    assert.match(source, /\.kill\(\)|killTweensOf\(/, `${owner} lost its observed explicit GSAP cleanup`);
  }

  for (const owner of baseline.cleanup.gsapContextManagedOwners) {
    assert.match(sources[owner], /\buseGSAP\s*\(/, `${owner} lost its useGSAP-owned context lifecycle`);
  }

  const aggregate = Object.values(sources).join("\n");
  const mediaAdds = (aggregate.match(/\.addEventListener\(\s*["']change["']/g) ?? []).length;
  const mediaRemoves = (aggregate.match(/\.removeEventListener\(\s*["']change["']/g) ?? []).length;
  assert.equal(mediaAdds, mediaRemoves, "Media-query change listeners must remain balanced");
  assert.equal(baseline.cleanup.observedMediaQueryChangeListenerPairs, 0);
});

/**
 * Property 2: Preservation - its passing command is isolated from exploration failures.
 * **Validates: Requirements 3.10**
 */
test("the preservation command is non-watch and never invokes the intentional task 1 failures", () => {
  const packageJson = readJson("package.json");
  assert.equal(packageJson.scripts["test:preservation"], "node test/preservation/run-all.mjs");
  assert.equal(packageJson.scripts["test:preservation:unit"], "node --test test/preservation/unit.test.mjs");
  assert.equal(packageJson.scripts["test:preservation:property"], "node --test test/preservation/property.test.mjs");

  const runner = read("test/preservation/run-all.mjs");
  assert.match(runner, /test:preservation:unit/);
  assert.match(runner, /test:preservation:property/);
  assert.doesNotMatch(runner, /test:bug/);
  assert.doesNotMatch(runner, /--watch/);
});
