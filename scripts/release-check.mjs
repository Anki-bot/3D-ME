import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const AUDITED_NODE_VERSION = "24.18.0";
export const SUPPORTED_NODE_RANGE = ">=24.0.0 <25.0.0";
export const SUPPORTED_NPM_RANGE = ">=11.0.0 <12.0.0";
export const RELEASE_BUILDER = "next build --webpack";

export const REQUIRED_RELEASE_ARTIFACTS = [
  "BUILD_ID",
  "build-manifest.json",
  "routes-manifest.json",
  "prerender-manifest.json",
  "server/app/page.js",
  "server/app/index.html",
];

export function parseVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$/.exec(value ?? "");
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isSupportedNodeVersion(value) {
  return parseVersion(value)?.major === 24;
}

export function isSupportedNpmVersion(value) {
  return parseVersion(value)?.major === 11;
}

export function npmVersionFromUserAgent(userAgent) {
  return userAgent?.match(/(?:^|\s)npm\/([^\s]+)/)?.[1] ?? null;
}

function issue(prerequisite, diagnostic, remediation) {
  return { prerequisite, diagnostic, remediation };
}

export function releasePrerequisiteIssues({
  nodeVersion,
  npmVersion,
  declaredNextVersion,
  lockedNextVersion,
  installedNextVersion,
  buildLocationError = null,
  tempLocationError = null,
}) {
  const issues = [];

  if (!isSupportedNodeVersion(nodeVersion)) {
    issues.push(issue(
      "Node runtime",
      `Node ${nodeVersion || "<unknown>"} is outside the supported release range ${SUPPORTED_NODE_RANGE}.`,
      `Install and select Node ${AUDITED_NODE_VERSION} (for example, run \`nvm install ${AUDITED_NODE_VERSION}\` and \`nvm use\`), then run \`npm ci\`.`,
    ));
  }

  if (!isSupportedNpmVersion(npmVersion)) {
    issues.push(issue(
      "npm runtime",
      `npm ${npmVersion || "<unknown>"} is outside the supported release range ${SUPPORTED_NPM_RANGE}.`,
      "Use the npm 11.x release bundled with the audited Node environment, then run `npm ci`.",
    ));
  }

  if (
    !declaredNextVersion ||
    !lockedNextVersion ||
    !installedNextVersion ||
    declaredNextVersion !== lockedNextVersion ||
    declaredNextVersion !== installedNextVersion
  ) {
    issues.push(issue(
      "Next.js installation",
      `Next.js versions are not aligned (package.json=${declaredNextVersion ?? "missing"}, package-lock.json=${lockedNextVersion ?? "missing"}, installed=${installedNextVersion ?? "missing"}).`,
      "Restore `package-lock.json` if needed and run `npm ci` before building.",
    ));
  }

  if (buildLocationError) {
    issues.push(issue(
      "build output",
      `The .next build location is not writable: ${buildLocationError}`,
      "Use a writable working copy and grant the current user write access to the project and existing `.next` directory.",
    ));
  }

  if (tempLocationError) {
    issues.push(issue(
      "temporary storage",
      `The operating-system temporary location is not writable: ${tempLocationError}`,
      "Set TMPDIR (or the platform equivalent) to a writable location with sufficient free space, then rerun the build.",
    ));
  }

  return issues;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function probeWritableLocation(requestedPath) {
  const absolutePath = path.resolve(requestedPath);
  let probeDirectory = absolutePath;

  if (fs.existsSync(absolutePath)) {
    if (!fs.statSync(absolutePath).isDirectory()) {
      throw new Error(`${absolutePath} exists but is not a directory`);
    }
  } else {
    probeDirectory = path.dirname(absolutePath);
    while (!fs.existsSync(probeDirectory)) {
      const parent = path.dirname(probeDirectory);
      if (parent === probeDirectory) break;
      probeDirectory = parent;
    }
  }

  if (!fs.existsSync(probeDirectory) || !fs.statSync(probeDirectory).isDirectory()) {
    throw new Error(`no existing parent directory is available for ${absolutePath}`);
  }

  let probePath;
  try {
    probePath = fs.mkdtempSync(path.join(probeDirectory, ".release-preflight-"));
  } finally {
    if (probePath) fs.rmSync(probePath, { recursive: true, force: true });
  }

  return { requestedPath: absolutePath, checkedDirectory: probeDirectory };
}

function probeResult(requestedPath) {
  try {
    return { ...probeWritableLocation(requestedPath), error: null };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? `${error.code}: ` : "";
    return {
      requestedPath: path.resolve(requestedPath),
      checkedDirectory: null,
      error: `${code}${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function inspectReleaseArtifacts(root = process.cwd()) {
  const nextDirectory = path.join(path.resolve(root), ".next");
  const errors = [];
  const present = new Set();

  for (const relativePath of REQUIRED_RELEASE_ARTIFACTS) {
    const artifactPath = path.join(nextDirectory, relativePath);
    try {
      const stat = fs.statSync(artifactPath);
      if (!stat.isFile() || stat.size === 0) {
        errors.push(`${relativePath} is not a nonempty file`);
      } else {
        present.add(relativePath);
      }
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? ` (${error.code})` : "";
      errors.push(`${relativePath} is missing${code}`);
    }
  }

  let buildId = null;
  if (present.has("BUILD_ID")) {
    buildId = fs.readFileSync(path.join(nextDirectory, "BUILD_ID"), "utf8").trim();
    if (!buildId) errors.push("BUILD_ID contains only whitespace");
  }

  let prerenderManifest = null;
  for (const relativePath of ["build-manifest.json", "routes-manifest.json", "prerender-manifest.json"]) {
    if (!present.has(relativePath)) continue;
    try {
      const parsed = readJson(path.join(nextDirectory, relativePath));
      if (relativePath === "prerender-manifest.json") prerenderManifest = parsed;
    } catch (error) {
      errors.push(`${relativePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const rootRoute = prerenderManifest?.routes?.["/"];
  if (!rootRoute) {
    errors.push("prerender-manifest.json does not contain the / route");
  } else if (rootRoute.initialRevalidateSeconds !== false) {
    errors.push("the / route is not recorded as a fully static prerender");
  }

  return {
    ok: errors.length === 0,
    errors,
    buildId,
    nextDirectory,
    rootRoute,
  };
}

export function runReleasePreflight({ root = process.cwd(), logger = console } = {}) {
  const projectRoot = path.resolve(root);
  const packageJson = readJson(path.join(projectRoot, "package.json"));

  let packageLock = null;
  try {
    packageLock = readJson(path.join(projectRoot, "package-lock.json"));
  } catch {
    packageLock = null;
  }

  let installedNextVersion = null;
  try {
    installedNextVersion = readJson(path.join(projectRoot, "node_modules/next/package.json")).version ?? null;
  } catch {
    installedNextVersion = null;
  }

  const npmVersion = npmVersionFromUserAgent(process.env.npm_config_user_agent);
  const buildProbe = probeResult(path.join(projectRoot, ".next"));
  const tempProbe = probeResult(os.tmpdir());
  const declaredNextVersion = packageJson.dependencies?.next ?? null;
  const lockedNextVersion = packageLock?.packages?.[""]?.dependencies?.next ?? null;
  const issues = releasePrerequisiteIssues({
    nodeVersion: process.version,
    npmVersion,
    declaredNextVersion,
    lockedNextVersion,
    installedNextVersion,
    buildLocationError: buildProbe.error,
    tempLocationError: tempProbe.error,
  });

  logger.log(`[release:preflight] Node: ${process.version} (supported: ${SUPPORTED_NODE_RANGE}; audited: v${AUDITED_NODE_VERSION})`);
  logger.log(`[release:preflight] npm: ${npmVersion ?? "unavailable"} (supported: ${SUPPORTED_NPM_RANGE})`);
  logger.log(`[release:preflight] Next.js: declared ${declaredNextVersion ?? "missing"}, locked ${lockedNextVersion ?? "missing"}, installed ${installedNextVersion ?? "missing"}`);
  logger.log(`[release:preflight] Builder: ${RELEASE_BUILDER}`);
  logger.log(`[release:preflight] Build output: ${buildProbe.requestedPath} (writable: ${buildProbe.error ? "no" : "yes"})`);
  logger.log(`[release:preflight] Temporary storage: ${tempProbe.requestedPath} (writable: ${tempProbe.error ? "no" : "yes"})`);
  logger.log(`[release:preflight] Available memory: ${Math.floor(os.freemem() / 1024 / 1024)} MiB (reported; compiler remains authoritative)`);

  if (issues.length > 0) {
    for (const current of issues) {
      logger.error(`[release:preflight] ERROR [${current.prerequisite}] ${current.diagnostic}`);
      logger.error(`[release:preflight] Remediation: ${current.remediation}`);
    }
    const error = new Error(`release preflight failed with ${issues.length} unmet prerequisite(s)`);
    error.code = "RELEASE_PREFLIGHT_FAILED";
    throw error;
  }

  logger.log("[release:preflight] All release prerequisites satisfied.");
  return {
    nodeVersion: process.version,
    npmVersion,
    builder: RELEASE_BUILDER,
    buildProbe,
    tempProbe,
  };
}

export function runArtifactValidation({ root = process.cwd(), logger = console } = {}) {
  const result = inspectReleaseArtifacts(root);
  if (!result.ok) {
    for (const errorMessage of result.errors) {
      logger.error(`[release:artifacts] ERROR ${errorMessage}`);
    }
    logger.error("[release:artifacts] Remediation: inspect the compiler output above, correct the release failure, and rerun `npm run build`; do not deploy this .next directory.");
    const error = new Error(`release artifact validation failed with ${result.errors.length} error(s)`);
    error.code = "RELEASE_ARTIFACTS_INVALID";
    throw error;
  }

  logger.log(`[release:artifacts] Verified release output at ${result.nextDirectory}`);
  logger.log(`[release:artifacts] BUILD_ID: ${result.buildId}`);
  logger.log("[release:artifacts] Static / route: prerender manifest and server/app/index.html verified.");
  return result;
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  const command = process.argv[2];
  try {
    if (command === "preflight") {
      runReleasePreflight();
    } else if (command === "artifacts") {
      runArtifactValidation();
    } else {
      throw new Error("expected `preflight` or `artifacts` command");
    }
  } catch (error) {
    console.error(`[release:${command ?? "check"}] FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
