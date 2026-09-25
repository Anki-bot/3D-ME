import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { root } from "./audit-model.mjs";

const nextDir = path.join(root, ".next");
const evidencePath = path.join(root, "test/bug-condition/fixtures/build-evidence.json");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const importantArtifacts = [
  "BUILD_ID",
  "prerender-manifest.json",
  "routes-manifest.json",
  "build-manifest.json",
  "diagnostics/build-diagnostics.json",
  "diagnostics/route-bundle-stats.json",
  "server/app/page.js",
];

function artifactSnapshot() {
  return Object.fromEntries(importantArtifacts.map((file) => {
    const artifactPath = path.join(nextDir, file);
    if (!fs.existsSync(artifactPath)) return [file, { exists: false }];
    const stat = fs.statSync(artifactPath);
    return [file, { exists: true, size: stat.size, modifiedAt: stat.mtime.toISOString() }];
  }));
}

function artifactExists(snapshot, file) {
  return snapshot[file]?.exists === true;
}

function changedArtifacts(before, after) {
  return importantArtifacts.filter((file) => {
    const previous = before[file];
    const current = after[file];
    return current?.exists && (
      !previous?.exists ||
      previous.size !== current.size ||
      previous.modifiedAt !== current.modifiedAt
    );
  });
}

function diagnosticStage(startedAt) {
  const diagnosticPath = path.join(nextDir, "diagnostics/build-diagnostics.json");
  if (!fs.existsSync(diagnosticPath)) return null;
  const stat = fs.statSync(diagnosticPath);
  if (stat.mtimeMs < startedAt) return null;
  try {
    return JSON.parse(fs.readFileSync(diagnosticPath, "utf8")).buildStage ?? null;
  } catch {
    return null;
  }
}

function announcedStage(output) {
  const stageLines = output
    .split("\n")
    .map((line) => line.replace(/^[\s✓▲]+/u, "").trim())
    .filter((line) => /(creating an optimized production build|compiled|typescript|collecting page data|generating static pages|finalizing page optimization|collecting build traces)/i.test(line));
  return stageLines.at(-1) ?? null;
}

function run({ command, args, label, builder }) {
  const before = artifactSnapshot();
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    timeout: 180000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const finishedAt = new Date().toISOString();
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const after = artifactSnapshot();
  const hasReleaseOutput = result.status === 0 &&
    artifactExists(after, "BUILD_ID") &&
    artifactExists(after, "prerender-manifest.json") &&
    artifactExists(after, "server/app/page.js");
  const prerequisitePattern = /(unsupported node|requires node|eacces|permission denied|no space|enospc|out of memory|enomem|cannot write|read-only file system)/i;
  const hasActionableExternalPrerequisiteDiagnostic = prerequisitePattern.test(output);

  return {
    command: label,
    builder,
    startedAt,
    finishedAt,
    exitStatus: result.status,
    signal: result.signal,
    timedOut: result.error?.code === "ETIMEDOUT",
    lastAnnouncedStage: announcedStage(output),
    lastCompletedBuildStage: diagnosticStage(startedAtMs),
    hasReleaseOutput,
    hasActionableExternalPrerequisiteDiagnostic,
    actionableDiagnostic: hasActionableExternalPrerequisiteDiagnostic
      ? output.split("\n").filter((line) => prerequisitePattern.test(line))
      : [],
    artifactsBefore: before,
    artifactsAfter: after,
    artifactsGeneratedOrChanged: changedArtifacts(before, after),
    output: output || "<no build output captured>",
  };
}

const configured = run({
  command: "npm",
  args: ["run", "build"],
  label: "npm run build",
  builder: `configured release path via package script: ${packageJson.scripts.build}`,
});
const webpack = run({
  command: path.join(root, "node_modules/.bin/next"),
  args: ["build", "--webpack"],
  label: "next build --webpack",
  builder: "explicit webpack",
});

const routeStatsPath = path.join(nextDir, "diagnostics/route-bundle-stats.json");
const routeBundleStats = fs.existsSync(routeStatsPath)
  ? JSON.parse(fs.readFileSync(routeStatsPath, "utf8"))
  : null;
const npmVersion = spawnSync("npm", ["--version"], { encoding: "utf8" }).stdout?.trim() ?? null;
const nextVersion = JSON.parse(fs.readFileSync(path.join(root, "node_modules/next/package.json"), "utf8")).version;

const evidence = {
  capturedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    npm: npmVersion,
    platform: process.platform,
    architecture: process.arch,
    next: nextVersion,
  },
  configured,
  webpack,
  routeBundleStats,
  auditedFirstLoadUncompressedJsBytes: 685160,
  baselineDisposition: routeBundleStats === null
    ? "Current build attempts did not emit route-bundle-stats.json; retain the audited 685160-byte baseline and do not substitute a different value."
    : "Current route bundle diagnostics captured; compare using the same uncompressed first-load method before changing the fixed audit baseline.",
};

fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
