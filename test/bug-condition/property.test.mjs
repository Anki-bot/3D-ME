import assert from "node:assert/strict";
import test from "node:test";
import {
  PROJECT_MODE_SERVER_FALLBACK,
  selectProjectMode,
} from "../../src/components/Projects/useProjectMode.ts";
import {
  ACTIVE_SECTION_IDS,
  ACTIVE_SECTION_OBSERVER_OPTIONS,
  selectActiveSection,
} from "../../src/hooks/navigation/useActiveSection.ts";
import {
  currentEligibilityResult,
  currentResourceCountAfter,
  expectedEligibility,
  expectedResourceCountAfter,
  xorshift,
} from "./audit-model.mjs";

const runs = 200;

function activationBand(viewportHeight) {
  const margins = ACTIVE_SECTION_OBSERVER_OPTIONS.rootMargin.split(/\s+/);
  const topInset = Math.abs(Number.parseFloat(margins[0])) / 100;
  const bottomInset = Math.abs(Number.parseFloat(margins[2])) / 100;

  return {
    top: viewportHeight * topInset,
    bottom: viewportHeight * (1 - bottomInset),
  };
}

/**
 * Property 1: Bug Condition - All Audited Conditions Produce Correct Results
 * **Validates: Requirements 1.2, 2.2**
 */
test("Property 1 selects any section containing the activation line regardless of height", () => {
  const random = xorshift();

  for (let index = 0; index < runs; index += 1) {
    const viewportHeight = 320 + Math.floor(random() * 1281);
    const band = activationBand(viewportHeight);
    const targetIndex = index % ACTIVE_SECTION_IDS.length;
    const heightKind = Math.floor(index / ACTIVE_SECTION_IDS.length) % 3;
    const targetHeight =
      heightKind === 0
        ? 1 + random() * (viewportHeight - 1)
        : heightKind === 1
          ? viewportHeight
          : viewportHeight * (1.01 + random() * 4.99);
    const heights = ACTIVE_SECTION_IDS.map(
      (_, sectionIndex) =>
        sectionIndex === targetIndex
          ? targetHeight
          : 1 + random() * viewportHeight * 4,
    );
    const targetDepth = targetHeight * (0.05 + random() * 0.9);
    const bounds = Array.from({ length: ACTIVE_SECTION_IDS.length });

    bounds[targetIndex] = {
      top: band.top - targetDepth,
      bottom: band.top - targetDepth + targetHeight,
    };

    for (let sectionIndex = targetIndex - 1; sectionIndex >= 0; sectionIndex -= 1) {
      const bottom = bounds[sectionIndex + 1].top;
      bounds[sectionIndex] = {
        top: bottom - heights[sectionIndex],
        bottom,
      };
    }

    for (
      let sectionIndex = targetIndex + 1;
      sectionIndex < ACTIVE_SECTION_IDS.length;
      sectionIndex += 1
    ) {
      const top = bounds[sectionIndex - 1].bottom;
      bounds[sectionIndex] = {
        top,
        bottom: top + heights[sectionIndex],
      };
    }

    const intersectingSections = new Set(
      ACTIVE_SECTION_IDS.filter((_, sectionIndex) => {
        const section = bounds[sectionIndex];
        return section.bottom > band.top && section.top < band.bottom;
      }),
    );
    const expected = ACTIVE_SECTION_IDS[targetIndex];
    const actual = selectActiveSection(intersectingSections);

    assert.equal(
      actual,
      expected,
      `Counterexample: ${JSON.stringify({ index, viewportHeight, heightKind, targetHeight, band, bounds, intersectingSections: [...intersectingSections], expected, actual })}`,
    );
  }
});

/**
 * Property 1: Bug Condition - All Audited Conditions Produce Correct Results
 * **Validates: Requirements 1.7, 2.7**
 */
test("Property 1 keeps project content reachable for generated supported viewports", () => {
  const random = xorshift(0x320390);
  const concreteViewports = [
    { name: "phone-320", width: 320, height: 568, expectedMode: "flow" },
    { name: "short-landscape", width: 844, height: 390, expectedMode: "flow" },
    { name: "tablet", width: 768, height: 1024, expectedMode: "flow" },
    { name: "wide-tall-desktop", width: 1440, height: 1000, expectedMode: "pinned" },
  ];

  assert.equal(PROJECT_MODE_SERVER_FALLBACK, "flow");
  for (const viewport of concreteViewports) {
    assert.equal(
      selectProjectMode(viewport),
      viewport.expectedMode,
      `Counterexample: ${JSON.stringify(viewport)}`,
    );
  }

  for (let index = 0; index < runs; index += 1) {
    const width = 320 + Math.floor(random() * 1121);
    const height = 390 + Math.floor(random() * 635);
    const expectedMode = width < 1024 || height < 720 ? "flow" : "pinned";
    const actualMode = selectProjectMode({ width, height });

    assert.equal(
      actualMode,
      expectedMode,
      `Counterexample: ${JSON.stringify({ index, width, height, expectedMode, actualMode })}`,
    );
  }
});

/**
 * Property 1: Bug Condition - All Audited Conditions Produce Correct Results
 * **Validates: Requirements 1.8, 1.9, 1.10, 2.8, 2.9, 2.10**
 */
test("Property 1 creates cursor and motion work only for eligible generated states", () => {
  for (let mask = 0; mask < 64; mask += 1) {
    const input = {
      finePointer: Boolean(mask & 1),
      hover: Boolean(mask & 2),
      reducedMotion: Boolean(mask & 4),
      responsiveVisible: Boolean(mask & 8),
      elementVisible: Boolean(mask & 16),
      documentVisible: Boolean(mask & 32),
    };
    const expected = expectedEligibility(input);
    const actual = currentEligibilityResult(input);
    const workRunning = actual.customCursorRunning || actual.lenisRunning || actual.parallaxRunning || actual.infiniteAnimationRunning;
    assert.ok(
      expected || (!workRunning && actual.nativeCursorVisible),
      `Counterexample: ${JSON.stringify({ input, expectedEligible: expected, actual })}`,
    );
  }
});

/**
 * Property 1: Bug Condition - All Audited Conditions Produce Correct Results
 * **Validates: Requirements 1.10, 2.10**
 */
test("Property 1 disposes resources across generated eligibility transitions", () => {
  const sequences = [
    ["mount", "eligible", "ineligible"],
    ["mount", "eligible", "ineligible", "eligible", "ineligible"],
    ["mount", "ineligible"],
    ["mount", "eligible", "unmount"],
  ];
  for (const sequence of sequences) {
    const actual = currentResourceCountAfter(sequence);
    const expected = expectedResourceCountAfter(sequence);
    assert.equal(actual, expected, `Counterexample: ${JSON.stringify({ sequence, expectedLiveResources: expected, actualLiveResources: actual })}`);
  }
});

/**
 * Property 1: Bug Condition - All Audited Conditions Produce Correct Results
 * **Validates: Requirements 1.3, 1.12, 2.3, 2.12**
 */
test("Property 1 exposes one current real destination for every generated active navigation state", async () => {
  const { getNavigationAriaCurrent } = await import(
    "../../src/hooks/navigation/useActiveSection.ts"
  );
  const { read } = await import("./audit-model.mjs");
  const nav = read("src/components/Navigation/NavLinks.tsx");
  const linkPattern = /\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)",\s*id:\s*"([^"]+)"\s*\}/g;
  const links = [...nav.matchAll(linkPattern)].map(([, label, href, id]) => ({
    label,
    href,
    id,
  }));
  const expectedLinks = [
    { label: "Home", href: "#home", id: "home" },
    { label: "About", href: "#about", id: "about" },
    { label: "Work", href: "#projects", id: "projects" },
  ];
  const random = xorshift(0xa11ce);

  assert.deepEqual(links, expectedLinks);

  for (let index = 0; index < runs; index += 1) {
    const activeSection = links[Math.floor(random() * links.length)].id;
    const states = links.map((link) => ({
      ...link,
      ariaCurrent: getNavigationAriaCurrent(activeSection, link.id),
    }));
    const currentStates = states.filter(
      ({ ariaCurrent }) => ariaCurrent !== undefined,
    );

    assert.deepEqual(
      currentStates,
      [
        {
          ...links.find(({ id }) => id === activeSection),
          ariaCurrent: "page",
        },
      ],
      `Counterexample: ${JSON.stringify({ index, activeSection, states })}`,
    );
    assert.ok(
      states.every(({ id, href }) => href === `#${id}`),
      `Counterexample: ${JSON.stringify({ index, activeSection, states })}`,
    );
  }
});