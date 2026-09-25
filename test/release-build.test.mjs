import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  AUDITED_NODE_VERSION,
  REQUIRED_RELEASE_ARTIFACTS,
  SUPPORTED_NODE_RANGE,
  inspectReleaseArtifacts,
  isSupportedNodeVersion,
  releasePrerequisiteIssues,
} from "../scripts/release-check.mjs";

const root = path.resolve(import.meta.dirname, "..");

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
}

function writeArtifactFixture(fixtureRoot, mask, includeStaticRoot) {
  const nextDirectory = path.join(fixtureRoot, ".next");
  fs.mkdirSync(path.join(nextDirectory, "server/app"), { recursive: true });

  const contents = {
    "BUILD_ID": "test-build-id\n",
    "build-manifest.json": "{}\n",
    "routes-manifest.json": "{}\n",
    "prerender-manifest.json": `${JSON.stringify({
      routes: includeStaticRoot
        ? { "/": { initialRevalidateSeconds: false, srcRoute: "/" } }
        : {},
    })}\n`,
    "server/app/page.js": "export default {};\n",
    "server/app/index.html": "<!doctype html><title>Static root</title>\n",
  };

  REQUIRED_RELEASE_ARTIFACTS.forEach((relativePath, index) => {
    if ((mask & (1 << index)) === 0) return;
    const artifactPath = path.join(nextDirectory, relativePath);
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, contents[relativePath]);
  });
}

function xorshift(seed = 0x24_18_00) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

/** Validates: Requirements 1.1, 2.1, 3.1, 3.2 */
test("release scripts select webpack directly and retain separate default-builder diagnostics", () => {
  const packageJson = readPackageJson();
  assert.equal(packageJson.engines.node, SUPPORTED_NODE_RANGE);
  assert.equal(packageJson.packageManager, "npm@11.16.0");
  assert.equal(packageJson.scripts.prebuild, "node scripts/release-check.mjs preflight");
  assert.equal(packageJson.scripts.build, "next build --webpack");
  assert.equal(packageJson.scripts.postbuild, "node scripts/release-check.mjs artifacts");
  assert.equal(packageJson.scripts["build:diagnostic:default"], "next build");
  assert.equal(packageJson.scripts.lint, "eslint");
  assert.doesNotMatch(packageJson.scripts.build, /no-lint|ignoreBuildErrors|typescript/i);
});

/** Validates: Requirements 2.1 */
test("unsupported prerequisites produce named diagnostics with direct remediation", () => {
  const issues = releasePrerequisiteIssues({
    nodeVersion: "v23.11.0",
    npmVersion: "10.9.0",
    declaredNextVersion: "16.2.12",
    lockedNextVersion: "16.2.12",
    installedNextVersion: null,
    buildLocationError: "EACCES: permission denied",
    tempLocationError: "ENOSPC: no space left",
  });

  assert.deepEqual(issues.map(({ prerequisite }) => prerequisite), [
    "Node runtime",
    "npm runtime",
    "Next.js installation",
    "build output",
    "temporary storage",
  ]);
  for (const current of issues) {
    assert.ok(current.diagnostic.length > 0);
    assert.ok(current.remediation.length > 0);
  }
  assert.match(issues[0].remediation, new RegExp(AUDITED_NODE_VERSION.replaceAll(".", "\\.")));
  assert.match(issues[2].remediation, /npm ci/);
});

/** Validates: Requirements 2.1, 3.1 */
test("release artifact validation accepts a complete static root build", (context) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifacts-unit-"));
  context.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  writeArtifactFixture(fixtureRoot, (1 << REQUIRED_RELEASE_ARTIFACTS.length) - 1, true);

  const result = inspectReleaseArtifacts(fixtureRoot);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.buildId, "test-build-id");
  assert.equal(result.rootRoute.srcRoute, "/");
});

/**
 * Property 1: Bug Condition - unsupported and supported generated Node versions are classified by the declared release range.
 * **Validates: Requirements 1.1, 2.1**
 */
test("Property 1 classifies generated Node versions against the supported major", () => {
  const random = xorshift();
  for (let index = 0; index < 500; index += 1) {
    const major = random() % 40;
    const minor = random() % 100;
    const patch = random() % 100;
    const version = `${major}.${minor}.${patch}`;
    assert.equal(
      isSupportedNodeVersion(version),
      major === 24,
      `Counterexample: ${JSON.stringify({ version, expected: major === 24 })}`,
    );
  }
});

/**
 * Property 1: Bug Condition - release output is accepted if and only if every required artifact and the static root route exist.
 * **Validates: Requirements 1.1, 2.1, 3.1**
 */
test("Property 1 rejects every generated incomplete release artifact set", () => {
  const completeMask = (1 << REQUIRED_RELEASE_ARTIFACTS.length) - 1;

  for (let mask = 0; mask <= completeMask; mask += 1) {
    for (const includeStaticRoot of [false, true]) {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifacts-property-"));
      try {
        writeArtifactFixture(fixtureRoot, mask, includeStaticRoot);
        const result = inspectReleaseArtifacts(fixtureRoot);
        const expected = mask === completeMask && includeStaticRoot;
        assert.equal(
          result.ok,
          expected,
          `Counterexample: ${JSON.stringify({ mask, includeStaticRoot, errors: result.errors })}`,
        );
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    }
  }
});
