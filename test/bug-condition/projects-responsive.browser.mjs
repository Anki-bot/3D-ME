import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readJson, root } from "./audit-model.mjs";

const chrome =
  process.env.PORTFOLIO_AUDIT_CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const appPort = 4322;
const debugPort = 9332;
const baseUrl = `http://localhost:${appPort}`;
const expectedProjects = readJson(
  "test/preservation/fixtures/unfixed-preservation.json",
).projects;
const viewports = [
  { name: "phone-320", width: 320, height: 568, expectedMode: "flow" },
  {
    name: "short-landscape",
    width: 844,
    height: 390,
    expectedMode: "flow",
  },
  { name: "tablet", width: 768, height: 1024, expectedMode: "flow" },
  {
    name: "wide-tall-desktop",
    width: 1440,
    height: 1000,
    expectedMode: "pinned",
  },
];
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(url, timeout = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 2_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

class Cdp {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.eventLog = [];
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.method) this.eventLog.push(message);

      if (message.method && this.eventWaiters.has(message.method)) {
        const waiters = this.eventWaiters.get(message.method);
        this.eventWaiters.delete(message.method);
        for (const waiter of waiters) waiter.resolve(message.params);
      }

      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
  }

  waitForEvent(method, timeout = 30_000) {
    return new Promise((resolve, reject) => {
      const waiters = this.eventWaiters.get(method) ?? new Set();
      let timer;
      const waiter = {
        resolve: (params) => {
          clearTimeout(timer);
          resolve(params);
        },
      };

      waiters.add(waiter);
      this.eventWaiters.set(method, waiters);
      timer = setTimeout(() => {
        waiters.delete(waiter);
        if (waiters.size === 0) this.eventWaiters.delete(method);
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeout);
    });
  }

  async navigate(url) {
    const loaded = this.waitForEvent("Page.loadEventFired");
    const result = await this.send("Page.navigate", { url });
    if (result.errorText) {
      throw new Error(`Navigation to ${url} failed: ${result.errorText}`);
    }
    await loaded;
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const description =
        result.exceptionDetails.exception?.description ??
        result.result?.description ??
        result.exceptionDetails.text;
      throw new Error(description);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

if (!fs.existsSync(chrome)) {
  throw new Error(
    `Chrome executable not found at ${chrome}; set PORTFOLIO_AUDIT_CHROME to an installed Chromium-compatible browser`,
  );
}

const browserVersion =
  spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout?.trim() ??
  "unknown";
const externalServer = process.env.PORTFOLIO_AUDIT_EXTERNAL_SERVER === "1";
const server = externalServer
  ? null
  : spawn(
      path.join(root, "node_modules/.bin/next"),
      ["dev", "--webpack", "-p", String(appPort)],
      {
        cwd: root,
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
let serverOutput = "";
server?.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
server?.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});

const userDataDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "portfolio-projects-chrome-"),
);
const browser = spawn(
  chrome,
  [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const failures = [];
const observations = [];
let harnessError = null;
function check(condition, kind, counterexample) {
  if (!condition) failures.push({ kind, counterexample });
}

let cdp;
try {
  await waitFor(baseUrl);
  const targets = await (
    await waitFor(`http://127.0.0.1:${debugPort}/json/list`)
  ).json();
  const target = targets.find((candidate) => candidate.type === "page");
  if (!target) throw new Error("Chrome exposed no page target");

  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  for (const viewport of viewports) {
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 600,
    });

    const viewportUrl = `${baseUrl}/?projects-viewport=${encodeURIComponent(viewport.name)}`;
    const expectedSearch = new URL(viewportUrl).search;
    const eventStart = cdp.eventLog.length;
    await cdp.navigate(viewportUrl);

    const geometry = await cdp.evaluate(`(async () => {
      const expectedMode = ${JSON.stringify(viewport.expectedMode)};
      const expectedProjects = ${JSON.stringify(expectedProjects)};
      const expectedSearch = ${JSON.stringify(expectedSearch)};
      let section = null;
      let modeOwner = null;

      for (let attempt = 0; attempt < 120; attempt += 1) {
        section = document.getElementById("projects");
        modeOwner = section?.querySelector("[data-project-mode]") ?? null;
        if (
          document.readyState === "complete" &&
          location.search === expectedSearch &&
          section?.dataset.projectHydrated === "true" &&
          modeOwner?.dataset.projectMode === expectedMode
        ) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (document.fonts?.ready) await document.fonts.ready;

      const mediaMatches = matchMedia(
        "(min-width: 1024px) and (min-height: 720px)",
      ).matches;
      const hydrated = section?.dataset.projectHydrated === "true";
      const ready =
        document.readyState === "complete" &&
        location.search === expectedSearch &&
        hydrated &&
        modeOwner?.dataset.projectMode === expectedMode;
      if (!ready) {
        return {
          ready: false,
          documentReadyState: document.readyState,
          hydrated,
          hydrationSignal: section?.dataset.projectHydrated ?? null,
          expectedMode,
          expectedSearch,
          renderedMode: modeOwner?.dataset.projectMode ?? null,
          renderedSearch: location.search,
          renderedUrl: location.href,
          viewport: { width: innerWidth, height: innerHeight },
          mediaMatches,
        };
      }

      const articles = [...section.querySelectorAll("article[data-project-id]")];
      const projectIds = articles.map((article) => Number(article.dataset.projectId));
      const serializeRect = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      const isRendered = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const normalizeText = (element) =>
        element?.textContent?.replace(/\\s+/g, " ").trim() ?? null;
      const projectFields = expectedProjects.map((project) => {
        const article = articles.find(
          (candidate) => Number(candidate.dataset.projectId) === project.id,
        );
        const content = article?.querySelector("[data-project-content]") ?? null;
        const title = content?.querySelector("h2[data-project-element]") ?? null;
        const metadata = content?.querySelector("div[data-project-element]") ?? null;
        const metadataValues = metadata
          ? [...metadata.querySelectorAll("span")].filter(
              (element) => normalizeText(element) !== "",
            )
          : [];
        const paragraphs = content
          ? [...content.querySelectorAll("p[data-project-element]")]
          : [];
        const category = metadataValues[0] ?? null;
        const year = metadataValues.at(-1) ?? null;
        const description = paragraphs.at(-1) ?? null;
        const image = article?.querySelector("img") ?? null;
        const actual = {
          title: normalizeText(title),
          category: normalizeText(category),
          year: normalizeText(year),
          description: normalizeText(description),
          imageAlt: image?.getAttribute("alt") ?? null,
        };
        const expected = {
          title: project.title,
          category: project.category,
          year: String(project.year),
          description: project.description,
          imageAlt: project.title,
        };
        const exact = Object.fromEntries(
          Object.keys(expected).map((field) => [
            field,
            actual[field] === expected[field],
          ]),
        );
        const rendered = [title, category, year, description, image].every(
          isRendered,
        );

        return {
          id: project.id,
          articleFound: Boolean(article),
          actual,
          expected,
          exact,
          rendered,
        };
      });
      const allFieldsPresent = projectFields.every(
        ({ articleFound, exact, rendered }) =>
          articleFound && rendered && Object.values(exact).every(Boolean),
      );
      const clippingAncestors = articles.flatMap((article) => {
        const clipped = [];
        let ancestor = article.parentElement;
        while (ancestor && ancestor !== section) {
          const style = getComputedStyle(ancestor);
          if (
            ["hidden", "clip"].includes(style.overflowY) &&
            ancestor.scrollHeight > ancestor.clientHeight + 1
          ) {
            clipped.push({
              tag: ancestor.tagName,
              classes: ancestor.className,
              clientHeight: ancestor.clientHeight,
              scrollHeight: ancestor.scrollHeight,
            });
          }
          ancestor = ancestor.parentElement;
        }
        return clipped;
      });
      const structure = [modeOwner, modeOwner.firstElementChild, ...articles]
        .filter(Boolean)
        .map((element) => ({
          classes: element.className,
          position: getComputedStyle(element).position,
          overflowY: getComputedStyle(element).overflowY,
          inlineHeight: element.style.height,
        }));
      const horizontalRects = articles.map(serializeRect);
      const reachability = [];

      if (expectedMode === "flow") {
        for (const article of articles) {
          article.scrollIntoView({ behavior: "instant", block: "center" });
          await new Promise((resolve) => setTimeout(resolve, 80));
          const rect = article.getBoundingClientRect();
          reachability.push({
            id: Number(article.dataset.projectId),
            top: rect.top,
            bottom: rect.bottom,
            intersectsViewport: rect.bottom > 0 && rect.top < innerHeight,
          });
        }
      }

      const sticky = expectedMode === "pinned" ? modeOwner.firstElementChild : null;
      const stickyRect = sticky ? sticky.getBoundingClientRect() : null;

      return {
        ready: true,
        hydrated,
        hydrationSignal: section.dataset.projectHydrated,
        renderedUrl: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        mode: modeOwner.dataset.projectMode,
        mediaMatches: matchMedia("(min-width: 1024px) and (min-height: 720px)").matches,
        articleCount: articles.length,
        projectIds,
        allFieldsPresent,
        projectFields,
        clippingAncestors,
        structure,
        horizontalRects,
        reachability,
        modeInlineHeight: modeOwner.style.height,
        sticky: sticky && {
          position: getComputedStyle(sticky).position,
          overflow: getComputedStyle(sticky).overflow,
          height: stickyRect.height,
          classes: sticky.className,
        },
        documentHeight: document.documentElement.scrollHeight,
      };
    })()`);

    const pageEvents = cdp.eventLog.slice(eventStart);
    const browserErrors = {
      runtimeExceptions: pageEvents
        .filter(({ method }) => method === "Runtime.exceptionThrown")
        .map(
          ({ params }) =>
            params.exceptionDetails?.exception?.description ??
            params.exceptionDetails?.text ??
            "Unknown runtime exception",
        ),
      consoleErrors: pageEvents
        .filter(
          ({ method, params }) =>
            method === "Runtime.consoleAPICalled" && params.type === "error",
        )
        .map(({ params }) =>
          params.args
            .map((argument) =>
              argument.value === undefined
                ? (argument.description ?? argument.type)
                : String(argument.value),
            )
            .join(" "),
        ),
      pageLogErrors: pageEvents
        .filter(
          ({ method, params }) =>
            method === "Log.entryAdded" &&
            params.entry?.level === "error" &&
            !(
              params.entry.source === "network" &&
              params.entry.text.includes("/_next/webpack-hmr")
            ),
        )
        .map(({ params }) => ({
          source: params.entry.source,
          text: params.entry.text,
          url: params.entry.url,
          lineNumber: params.entry.lineNumber,
        })),
      devTransportErrors: pageEvents
        .filter(
          ({ method, params }) =>
            method === "Log.entryAdded" &&
            params.entry?.level === "error" &&
            params.entry.source === "network" &&
            params.entry.text.includes("/_next/webpack-hmr"),
        )
        .map(({ params }) => params.entry.text),
      targetCrashes: pageEvents
        .filter(({ method }) => method === "Inspector.targetCrashed")
        .map(({ params }) => params ?? {}),
    };
    geometry.browserErrors = browserErrors;
    const browserErrorCount =
      browserErrors.runtimeExceptions.length +
      browserErrors.consoleErrors.length +
      browserErrors.pageLogErrors.length +
      browserErrors.targetCrashes.length;

    check(geometry?.hydrated === true, "PROJECT_HYDRATION", {
      viewport,
      geometry,
    });
    check(browserErrorCount === 0, "PROJECT_BROWSER_ERRORS", {
      viewport,
      browserErrors,
    });
    check(geometry?.ready === true, "PROJECT_VIEWPORT_READY", {
      viewport,
      geometry,
    });
    if (!geometry?.ready) {
      observations.push({ viewport: viewport.name, geometry });
      continue;
    }

    const expectedPinned = viewport.expectedMode === "pinned";
    check(geometry.mode === viewport.expectedMode, "PROJECT_MODE", {
      viewport,
      mode: geometry.mode,
    });
    check(geometry.mediaMatches === expectedPinned, "PROJECT_MODE_QUERY", {
      viewport,
      mediaMatches: geometry.mediaMatches,
    });
    check(
      geometry.articleCount === (expectedPinned ? 1 : expectedProjects.length),
      "PROJECT_ACCESSIBLE_INSTANCES",
      {
        viewport,
        articleCount: geometry.articleCount,
        projectIds: geometry.projectIds,
      },
    );

    if (!expectedPinned) {
      check(
        JSON.stringify(geometry.projectIds) ===
          JSON.stringify(expectedProjects.map(({ id }) => id)),
        "PROJECT_ORDER",
        { viewport, projectIds: geometry.projectIds },
      );
      check(geometry.allFieldsPresent, "PROJECT_FIELDS", {
        viewport,
        projectFields: geometry.projectFields,
      });
      check(
        geometry.modeInlineHeight === "" &&
          geometry.structure.every(
            ({ classes, position }) =>
              position !== "sticky" &&
              !String(classes).split(/\\s+/).includes("h-screen") &&
              !String(classes).split(/\\s+/).includes("overflow-hidden"),
          ),
        "PROJECT_NORMAL_FLOW",
        {
          viewport,
          structure: geometry.structure,
          modeInlineHeight: geometry.modeInlineHeight,
        },
      );
      check(geometry.clippingAncestors.length === 0, "PROJECT_CLIPPING", {
        viewport,
        clippingAncestors: geometry.clippingAncestors,
      });
      check(
        geometry.reachability.length === expectedProjects.length &&
          geometry.reachability.every(
            ({ intersectsViewport }) => intersectsViewport,
          ),
        "PROJECT_REACHABILITY",
        { viewport, reachability: geometry.reachability },
      );
      check(
        geometry.horizontalRects.every(
          ({ left, right }) =>
            left >= -0.5 && right <= viewport.width + 0.5,
        ),
        "PROJECT_HORIZONTAL_CONTAINMENT",
        { viewport, horizontalRects: geometry.horizontalRects },
      );
    } else {
      check(
        geometry.modeInlineHeight === `${expectedProjects.length * 100}vh`,
        "PROJECT_PINNED_HEIGHT",
        { viewport, modeInlineHeight: geometry.modeInlineHeight },
      );
      check(
        geometry.sticky?.position === "sticky" &&
          geometry.sticky?.overflow === "hidden" &&
          Math.abs(geometry.sticky.height - viewport.height) <= 1 &&
          String(geometry.sticky.classes).includes("h-screen"),
        "PROJECT_PINNED_ARCHITECTURE",
        { viewport, sticky: geometry.sticky },
      );
      check(
        geometry.projectIds[0] === expectedProjects[0].id,
        "PROJECT_INITIAL_INDEX",
        { viewport, projectIds: geometry.projectIds },
      );

      const bounds = await cdp.evaluate(`(() => {
        const owner = document.querySelector('#projects [data-project-mode="pinned"]');
        if (!owner) {
          return {
            found: false,
            renderedUrl: location.href,
            renderedModes: [...document.querySelectorAll('#projects [data-project-mode]')]
              .map((element) => element.dataset.projectMode),
          };
        }
        return {
          found: true,
          top: owner.getBoundingClientRect().top + scrollY,
          range: owner.offsetHeight - innerHeight,
        };
      })()`);
      check(bounds.found, "PROJECT_PINNED_OWNER", { viewport, bounds });

      const mapping = [];
      if (bounds.found) {
        for (const progress of [0, 0.26, 0.6, 1]) {
          await cdp.evaluate(
            `scrollTo({ top: ${bounds.top} + ${bounds.range} * ${progress}, behavior: "instant" })`,
          );
          await sleep(300);
          const activeId = await cdp.evaluate(
            `Number(document.querySelector('#projects [data-project-mode="pinned"] article[data-project-id]')?.dataset.projectId)`,
          );
          const expectedIndex = Math.max(
            0,
            Math.min(
              Math.floor(progress * expectedProjects.length + 0.25),
              expectedProjects.length - 1,
            ),
          );
          mapping.push({
            progress,
            activeId,
            expectedId: expectedProjects[expectedIndex].id,
          });
        }
      }
      geometry.mapping = mapping;
      check(
        bounds.found &&
          mapping.length === 4 &&
          mapping.every(({ activeId, expectedId }) => activeId === expectedId),
        "PROJECT_PINNED_MAPPING",
        { viewport, mapping, bounds },
      );
    }

    observations.push({ viewport: viewport.name, geometry });
  }
} catch (error) {
  harnessError = error instanceof Error ? error.message : String(error);
  console.error(
    "Responsive projects browser harness failed:",
    error,
    "\nServer output:\n",
    serverOutput,
  );
} finally {
  cdp?.close();
  await terminate(browser);
  await terminate(server);
  fs.rmSync(userDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}

console.log(
  JSON.stringify(
    {
      property:
        "Property 1: Bug Condition - Projects are reachable in flow and preserved when pinned",
      validates: "Requirements 1.7, 2.7, 3.4, 3.5, 3.6, 3.8, 3.10",
      infrastructure: {
        browser: browserVersion,
        driver: "project-owned CDP harness",
        watch: false,
      },
      observations,
      failures,
      harnessError,
    },
    null,
    2,
  ),
);

if (harnessError) process.exitCode = 2;
else if (failures.length > 0) process.exitCode = 1;
