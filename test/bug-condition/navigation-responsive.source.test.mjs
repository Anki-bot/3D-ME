import assert from "node:assert/strict";
import test from "node:test";
import { read, readJson } from "./audit-model.mjs";

const navbar = read("src/components/Navigation/Navbar.tsx");
const navLinks = read("src/components/Navigation/NavLinks.tsx");
const navLogo = read("src/components/Navigation/NavLogo.tsx");

function assertTokens(source, tokens, label) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label} is missing ${JSON.stringify(token)}`);
  }
}

/**
 * Property 1: Bug Condition - supported navigation widths remain contained.
 * **Validates: Requirements 1.6, 2.6**
 */
test("responsive navigation uses an intrinsic desktop pill and a bounded compact mobile pill", () => {
  assertTokens(
    navbar,
    [
      "px-3",
      "w-full",
      "max-w-[calc(100vw-1.5rem)]",
      "gap-3",
      "sm:w-auto",
      "sm:max-w-none",
      "sm:gap-12",
      "sm:px-8",
      "sm:py-4",
    ],
    "navbar",
  );
  assertTokens(
    navLinks,
    [
      "gap-3 sm:gap-10",
      "whitespace-nowrap",
      "text-[0.6875rem]",
      "tracking-[0.16em]",
      "sm:text-sm",
      "sm:tracking-[0.28em]",
    ],
    "navigation links",
  );
  assertTokens(
    navLogo,
    [
      "shrink-0",
      "text-lg",
      "tracking-[0.25em]",
      "sm:text-xl",
      "sm:tracking-[0.35em]",
    ],
    "navigation logo",
  );

  assert.doesNotMatch(
    navbar + navLinks + navLogo,
    /overflow-(?:x-)?hidden/,
    "Navigation containment must not be implemented by clipping overflow",
  );
});

/**
 * Property 2: Preservation - destinations, keyboard semantics, and wide styling remain equivalent.
 * **Validates: Requirements 3.3, 3.4, 3.8, 3.10**
 */
test("all three destinations stay directly keyboard operable while wide glass-pill styling is preserved", () => {
  const links = [...navLinks.matchAll(/\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)",\s*id:\s*"([^"]+)"\s*\}/g)].map(
    ([, label, href, id]) => ({ label, href, id }),
  );

  assert.deepEqual(links, [
    { label: "Home", href: "#home", id: "home" },
    { label: "About", href: "#about", id: "about" },
    { label: "Work", href: "#projects", id: "projects" },
  ]);
  assert.match(navLinks, /<a[\s\S]*?href=\{link\.href\}/);
  assert.doesNotMatch(navLinks, /<button\b|tabIndex=\{-1\}|\bhidden\b/);
  assertTokens(navLinks, ["focus-visible:outline-2", "focus-visible:outline-white"], "navigation link focus treatment");
  assertTokens(navLogo, ["focus-visible:outline-2", "focus-visible:outline-white"], "logo focus treatment");

  assertTokens(
    navbar,
    [
      "rounded-full",
      "border-white/10",
      "bg-white/5",
      "sm:gap-12",
      "sm:px-8",
      "sm:py-4",
      "backdrop-blur-2xl",
    ],
    "wide navbar",
  );
  assertTokens(navLinks, ["sm:gap-10", "sm:text-sm", "sm:tracking-[0.28em]"], "wide navigation links");
  assertTokens(navLogo, ["sm:text-xl", "sm:tracking-[0.35em]", "hover:scale-105", "hover:opacity-80"], "wide logo");
});

/** Validates: Requirements 2.6, 3.10 */
test("focused navigation regressions remain available as deterministic non-watch commands", () => {
  const pkg = readJson("package.json");
  assert.equal(
    pkg.scripts["test:bug:navigation-source"],
    "node --test test/bug-condition/navigation-responsive.source.test.mjs",
  );
  assert.equal(
    pkg.scripts["test:bug:navigation-browser"],
    "node test/bug-condition/navigation-responsive.browser.mjs",
  );
  assert.doesNotMatch(pkg.scripts["test:bug:navigation-source"], /--watch/);
  assert.doesNotMatch(pkg.scripts["test:bug:navigation-browser"], /--watch/);

  const runner = read("test/bug-condition/run-all.mjs");
  assert.match(runner, /test:bug:navigation-source/);
  assert.match(runner, /test:bug:navigation-browser/);
});
