import assert from "node:assert/strict";
import test from "node:test";
import {
  optionalActionSemantics,
  pinnedProjectIndex,
  projectTransitionDirection,
  readJson,
  runMountUnmountCycles,
  semanticProject,
  xorshift,
} from "./preservation-model.mjs";

const baseline = readJson("test/preservation/fixtures/unfixed-preservation.json");
const runs = 400;

/**
 * Property 2: Preservation - pinned project selection retains its audited bias and clamp.
 * **Validates: Requirements 3.6, 3.10**
 */
test("Property 2 preserves clamp(floor(progress * count + 0.25), 0, count - 1) for generated pinned inputs", () => {
  const random = xorshift(0x25c10a9);
  for (let index = 0; index < runs; index += 1) {
    const projectCount = 1 + Math.floor(random() * 128);
    const progress = index === 0 ? 0 : index === 1 ? 1 : random();
    const expected = Math.max(
      0,
      Math.min(Math.floor(progress * projectCount + 0.25), projectCount - 1),
    );
    const actual = pinnedProjectIndex(progress, projectCount);

    assert.equal(
      actual,
      expected,
      `Counterexample: ${JSON.stringify({ index, progress, projectCount, expected, actual })}`,
    );
    assert.ok(actual >= 0 && actual < projectCount);
  }
});

/**
 * Property 2: Preservation - optional actions cannot alter project semantic content.
 * **Validates: Requirements 3.5, 3.8, 3.10**
 */
test("Property 2 keeps generated project semantics independent from valid, missing, and invalid optional actions", () => {
  const random = xorshift(0xac7105);
  for (let index = 0; index < runs; index += 1) {
    const record = {
      id: index + 1,
      title: `Generated Project ${Math.floor(random() * 1_000_000)}`,
      category: `Category ${Math.floor(random() * 100)}`,
      year: String(2000 + Math.floor(random() * 80)),
      description: `Description ${Math.floor(random() * 1_000_000)}`,
      image: `/images/generated-${index}.jpg`,
    };
    const validAction = {
      label: `Open Project ${index}`,
      href: index % 2 === 0 ? `/projects/${index}` : `https://example.test/projects/${index}`,
    };
    const variants = [
      record,
      { ...record, action: validAction },
      { ...record, action: { label: "", href: validAction.href } },
      { ...record, action: { label: validAction.label, href: "javascript:void(0)" } },
    ];

    for (const variant of variants) {
      assert.deepEqual(
        semanticProject(variant),
        record,
        `Counterexample: ${JSON.stringify({ index, variant })}`,
      );
    }
    assert.deepEqual(optionalActionSemantics(validAction), validAction);
    assert.equal(optionalActionSemantics(undefined), null);
    assert.equal(optionalActionSemantics({ label: "", href: validAction.href }), null);
    assert.equal(optionalActionSemantics({ label: validAction.label, href: "javascript:void(0)" }), null);
  }

  assert.deepEqual(baseline.projects.map(semanticProject), baseline.projects);
  assert.equal(baseline.projectActions.currentRecordsHaveDefinedActions, false);
});

/**
 * Property 2: Preservation - eligible project transitions keep alternating direction.
 * **Validates: Requirements 3.4, 3.6, 3.10**
 */
test("Property 2 preserves alternating transition direction for generated project identifiers", () => {
  for (let activeProject = 1; activeProject <= runs; activeProject += 1) {
    const direction = projectTransitionDirection(activeProject);
    assert.ok(direction === 1 || direction === -1);
    if (activeProject > 1) {
      assert.equal(
        direction,
        -projectTransitionDirection(activeProject - 1),
        `Counterexample: ${JSON.stringify({ activeProject, direction })}`,
      );
    }
  }
});

/**
 * Property 2: Preservation - every observed resource is released over repeated mounts.
 * **Validates: Requirements 3.9, 3.10**
 */
test("Property 2 leaves no generated listener, observer, Lenis, ticker, trigger, tween, context, or media-query resource live", () => {
  const random = xorshift(0xc1ea9);
  const resources = baseline.cleanup.lifecycleResources;
  for (let index = 0; index < runs; index += 1) {
    const cycles = 1 + Math.floor(random() * 64);
    const result = runMountUnmountCycles(resources, cycles);
    const expectedOperations = resources.length * cycles;
    assert.deepEqual(
      result,
      { created: expectedOperations, disposed: expectedOperations, live: 0 },
      `Counterexample: ${JSON.stringify({ index, cycles, resources, result })}`,
    );
  }
});
