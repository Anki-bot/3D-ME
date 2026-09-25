import assert from "node:assert/strict";
import test from "node:test";
import {
  getExploreWorkScrollBehavior,
  PROJECTS_FRAGMENT,
  PROJECTS_HEADING_ID,
  PROJECTS_SECTION_ID,
  shouldHandleExploreWorkActivation,
} from "../../src/lib/exploreWorkNavigation.ts";
import { read } from "./audit-model.mjs";

/** **Validates: Requirements 1.4, 2.4** */
test("Explore Work activation policy handles only an unmodified primary activation", () => {
  const activation = {
    button: 0,
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };

  assert.equal(shouldHandleExploreWorkActivation(activation), true);
  assert.equal(
    shouldHandleExploreWorkActivation({ ...activation, button: 1 }),
    false,
  );
  assert.equal(
    shouldHandleExploreWorkActivation({ ...activation, defaultPrevented: true }),
    false,
  );
  assert.equal(
    shouldHandleExploreWorkActivation({ ...activation, metaKey: true }),
    false,
  );
  assert.equal(getExploreWorkScrollBehavior(false), "smooth");
  assert.equal(getExploreWorkScrollBehavior(true), "instant");
});

/** **Validates: Requirements 1.4, 2.4, 3.3, 3.4, 3.10** */
test("Explore Work is a native fragment link with one scroll and accessible focus transfer", () => {
  const hero = read("src/components/Hero/HeroContent.tsx");
  const projects = read("src/components/Projects/Projects.tsx");
  const navigation = read("src/components/Navigation/NavLinks.tsx");

  assert.equal(PROJECTS_SECTION_ID, "projects");
  assert.equal(PROJECTS_HEADING_ID, "projects-heading");
  assert.equal(PROJECTS_FRAGMENT, "#projects");

  assert.match(hero, /<a[\s\S]*?href=["']#projects["']/);
  assert.match(hero, /onClick=\{handleExploreWorkActivation\}/);
  assert.doesNotMatch(hero, /<button\b/);
  assert.match(hero, /event\.preventDefault\(\)/);
  assert.match(hero, /history\.pushState\(null, "", PROJECTS_FRAGMENT\)/);
  assert.equal((hero.match(/scrollIntoView\(/g) ?? []).length, 1);
  assert.match(hero, /projectsHeading\.focus\(\{ preventScroll: true \}\)/);

  assert.match(projects, /id=\{PROJECTS_SECTION_ID\}/);
  assert.match(projects, /aria-labelledby=\{PROJECTS_HEADING_ID\}/);
  assert.match(
    projects,
    /id=\{PROJECTS_HEADING_ID\}[\s\S]*?tabIndex=\{-1\}/,
  );

  assert.match(
    navigation,
    /\{ label: "Work", href: "#projects", id: "projects" \}/,
  );
});
