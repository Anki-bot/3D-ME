import fs from "node:fs";
import path from "node:path";
import {
  read,
  readJson,
  root,
  xorshift,
} from "../bug-condition/audit-model.mjs";

export { read, readJson, root, xorshift };

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function jsxVisibleText(source) {
  return normalizeWhitespace(
    source
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

export function parseNavigationLinks(source) {
  const links = [];
  const pattern = /\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)",\s*id:\s*"([^"]+)"\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    links.push({ label: match[1], href: match[2], id: match[3] });
  }
  return links;
}

export function parseProjectRecords(source) {
  const records = [];
  const pattern = /\{\s*id:\s*(\d+),\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*year:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*image:\s*"([^"]+)",\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    records.push({
      id: Number(match[1]),
      title: match[2],
      category: match[3],
      year: match[4],
      description: match[5],
      image: match[6],
    });
  }
  return records;
}

export function semanticProject(record) {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    year: record.year,
    description: record.description,
    image: record.image,
  };
}

export function optionalActionSemantics(action) {
  if (!action || typeof action.label !== "string" || typeof action.href !== "string") {
    return null;
  }

  const label = action.label.trim();
  const href = action.href.trim();
  const executable = /^(?:https?:\/\/|\/|#)/.test(href);
  return label && executable ? { label, href } : null;
}

export function pinnedProjectIndex(progress, projectCount) {
  if (!Number.isInteger(projectCount) || projectCount <= 0) {
    throw new RangeError("projectCount must be a positive integer");
  }
  if (!Number.isFinite(progress)) {
    throw new TypeError("progress must be finite");
  }

  return Math.max(
    0,
    Math.min(Math.floor(progress * projectCount + 0.25), projectCount - 1),
  );
}

export function projectTransitionDirection(activeProject) {
  return activeProject % 2 === 0 ? 1 : -1;
}

function collectFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolutePath, files);
    else if (/\.(?:ts|tsx|css)$/.test(entry.name)) files.push(absolutePath);
  }
  return files;
}

export function readProductionSources() {
  const sourceRoot = path.join(root, "src");
  return Object.fromEntries(
    collectFiles(sourceRoot)
      .sort()
      .map((absolutePath) => [
        path.relative(root, absolutePath).split(path.sep).join("/"),
        fs.readFileSync(absolutePath, "utf8"),
      ]),
  );
}

export function extractSectionIds(sources) {
  const constants = new Map();
  for (const source of Object.values(sources)) {
    const constantPattern = /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*["']([^"']+)["']/g;
    for (const match of source.matchAll(constantPattern)) {
      constants.set(match[1], match[2]);
    }
  }

  const ids = [];
  for (const source of Object.values(sources)) {
    const pattern = /<section\b(?=[^>]*\bid\s*=)[^>]*\bid\s*=\s*(?:["']([^"']+)["']|\{([A-Za-z_$][\w$]*)\})[^>]*>/g;
    for (const match of source.matchAll(pattern)) {
      const id = match[1] ?? constants.get(match[2]);
      if (id) ids.push(id);
    }
  }
  return ids;
}

export function eventListenerBalance(source) {
  const balance = new Map();
  const pattern = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.(addEventListener|removeEventListener)\(\s*["']([^"']+)["']\s*,\s*([A-Za-z_$][\w$]*)/g;
  for (const match of source.matchAll(pattern)) {
    const key = `${match[1]}|${match[3]}|${match[4]}`;
    const current = balance.get(key) ?? { added: 0, removed: 0 };
    if (match[2] === "addEventListener") current.added += 1;
    else current.removed += 1;
    balance.set(key, current);
  }
  return balance;
}

export function runMountUnmountCycles(resources, cycles) {
  const live = new Set();
  let created = 0;
  let disposed = 0;

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (const resource of resources) {
      if (live.has(resource)) throw new Error(`duplicate resource on mount: ${resource}`);
      live.add(resource);
      created += 1;
    }
    for (const resource of [...resources].reverse()) {
      if (!live.delete(resource)) throw new Error(`missing resource on unmount: ${resource}`);
      disposed += 1;
    }
  }

  return { created, disposed, live: live.size };
}
