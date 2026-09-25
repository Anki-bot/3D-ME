import assert from "node:assert/strict";
import test from "node:test";
import {
  getExploreWorkScrollBehavior,
  shouldHandleExploreWorkActivation,
} from "../../src/lib/exploreWorkNavigation.ts";

/**
 * Property 1: Bug Condition - Explore Work produces accessible Projects navigation.
 * **Validates: Requirements 1.4, 2.4**
 */
test("Property 1 maps generated pointer and keyboard activation states to one motion-safe policy", () => {
  const activationKinds = ["pointer", "keyboard"];

  for (const activationKind of activationKinds) {
    for (let button = 0; button <= 2; button += 1) {
      for (let mask = 0; mask < 32; mask += 1) {
        const activation = {
          button,
          defaultPrevented: Boolean(mask & 1),
          altKey: Boolean(mask & 2),
          ctrlKey: Boolean(mask & 4),
          metaKey: Boolean(mask & 8),
          shiftKey: Boolean(mask & 16),
        };
        const expected =
          button === 0 &&
          !activation.defaultPrevented &&
          !activation.altKey &&
          !activation.ctrlKey &&
          !activation.metaKey &&
          !activation.shiftKey;

        assert.equal(
          shouldHandleExploreWorkActivation(activation),
          expected,
          `Counterexample: ${JSON.stringify({ activationKind, activation, expected })}`,
        );
      }
    }
  }

  for (const prefersReducedMotion of [false, true]) {
    assert.equal(
      getExploreWorkScrollBehavior(prefersReducedMotion),
      prefersReducedMotion ? "instant" : "smooth",
      `Counterexample: ${JSON.stringify({ prefersReducedMotion })}`,
    );
  }
});
