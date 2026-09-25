import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root, readJson } from "./audit-model.mjs";

const chrome = process.env.PORTFOLIO_AUDIT_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const appPort = 4317;
const debugPort = 9327;
const baseUrl = `http://127.0.0.1:${appPort}`;
const audit = readJson("test/bug-condition/fixtures/unfixed-audit.json");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(url, timeout = 60000) {
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
    }, 2000);
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
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
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
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      const description = result.exceptionDetails.exception?.description ?? result.result?.description ?? result.exceptionDetails.text;
      throw new Error(description);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

if (!fs.existsSync(chrome)) {
  throw new Error(`Chrome executable not found at ${chrome}; set PORTFOLIO_AUDIT_CHROME to an installed Chromium-compatible browser`);
}
const browserVersion = spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout?.trim() ?? "unknown";
const externalServer = process.env.PORTFOLIO_AUDIT_EXTERNAL_SERVER === "1";
const server = externalServer ? null : spawn(path.join(root, "node_modules/.bin/next"), ["dev", "--webpack", "-p", String(appPort)], {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server?.stdout.on("data", (chunk) => { serverOutput += chunk; });
server?.stderr.on("data", (chunk) => { serverOutput += chunk; });

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-audit-chrome-"));
const browser = spawn(chrome, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank",
], { stdio: "ignore" });

const failures = [];
const observations = [];
let harnessError = null;
function check(condition, kind, counterexample) {
  if (!condition) failures.push({ kind, counterexample });
}

let cdp;
try {
  await waitFor(baseUrl);
  const targets = await (await waitFor(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const target = targets.find((candidate) => candidate.type === "page");
  if (!target) throw new Error("Chrome exposed no page target");
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const viewport of audit.focusedViewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 600,
    });
    await cdp.send("Page.navigate", { url: baseUrl });
    await sleep(1200);
    const geometry = await cdp.evaluate(`(() => {
      const navbar = document.querySelector("header > div");
      const links = [...document.querySelectorAll("nav a")];
      const projects = document.getElementById("projects");
      const showcase = projects?.children?.[1];
      const navRect = navbar?.getBoundingClientRect();
      return {
        viewport: { width: innerWidth, height: innerHeight },
        navbar: navRect && { left: navRect.left, right: navRect.right, width: navRect.width },
        allDestinationsContained: links.every((link) => { const rect = link.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth; }),
        contactTargetExists: Boolean(document.getElementById("contact")),
        contactLinkRendered: Boolean(document.querySelector('a[href="#contact"]')),
        exploreElement: [...document.querySelectorAll("button, a")].find((element) => element.textContent?.includes("Explore Work"))?.tagName ?? null,
        projectActionCount: [...document.querySelectorAll("button, a")].filter((element) => element.textContent?.includes("View Project")).length,
        bodyCursor: getComputedStyle(document.body).cursor,
        progress: (() => { const label = [...document.querySelectorAll("span")].find((element) => element.textContent?.trim() === "Work" && getComputedStyle(element).writingMode.includes("vertical")); const owner = label?.parentElement?.parentElement; return owner ? { display: getComputedStyle(owner).display, position: getComputedStyle(owner).position } : null; })(),
        activeAriaCurrent: document.querySelector("nav a.text-white")?.getAttribute("aria-current") ?? null,
        showcaseTop: showcase ? showcase.getBoundingClientRect().top + scrollY : null,
      };
    })()`);
    observations.push({ viewport: viewport.name, geometry });
    check(geometry.allDestinationsContained, "NAV_VIEWPORT", { viewport, navbar: geometry.navbar, allDestinationsContained: false });
    check(!geometry.contactLinkRendered || geometry.contactTargetExists, "NAV_DESTINATION", { viewport: viewport.name, href: "#contact", targetExists: geometry.contactTargetExists });
    check(geometry.projectActionCount === 0, "PROJECT_ACTION", { viewport: viewport.name, renderedViewProjectControls: geometry.projectActionCount, definedDestinations: 0 });
    check(geometry.bodyCursor !== "none", "CURSOR_CAPABILITY", { viewport: viewport.name, bodyCursor: geometry.bodyCursor, pointerMoved: false });
    check(geometry.activeAriaCurrent === "page", "ACTIVE_NAV_SEMANTICS", { viewport: viewport.name, visuallyActiveLinkAriaCurrent: geometry.activeAriaCurrent });

    if (geometry.showcaseTop !== null) {
      await cdp.evaluate(`scrollTo(0, ${geometry.showcaseTop + 10}); new Promise((resolve) => setTimeout(resolve, 250))`);
      const projectGeometry = await cdp.evaluate(`(() => {
        const projects = document.getElementById("projects");
        const showcase = projects?.children?.[1];
        const sticky = showcase?.firstElementChild;
        const article = sticky?.querySelector("article");
        const content = sticky?.querySelector("[data-project-content]");
        const work = document.querySelector('nav a[href="#projects"]');
        if (!sticky || !content) return null;
        const stickyRect = sticky.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        return {
          sticky: { top: stickyRect.top, bottom: stickyRect.bottom, height: stickyRect.height, overflow: getComputedStyle(sticky).overflow },
          article: article && { top: article.getBoundingClientRect().top, bottom: article.getBoundingClientRect().bottom, height: article.getBoundingClientRect().height },
          content: { top: contentRect.top, bottom: contentRect.bottom, height: contentRect.height },
          contentReachable: contentRect.top >= stickyRect.top && contentRect.bottom <= stickyRect.bottom,
          workAriaCurrent: work?.getAttribute("aria-current") ?? null,
          workVisuallyActive: work?.classList.contains("text-white") ?? false,
        };
      })()`);
      observations.at(-1).projectGeometry = projectGeometry;
      check(projectGeometry?.contentReachable === true, "PROJECT_VIEWPORT", { viewport, projectGeometry });
      check(projectGeometry?.workVisuallyActive === true, "SECTION_VISIBILITY", { viewport, expectedActive: "projects", actualActive: "about/home", projectGeometry });
      check(projectGeometry?.workAriaCurrent === "page", "ACTIVE_NAV_SEMANTICS", { viewport: viewport.name, expected: "page", actual: projectGeometry?.workAriaCurrent ?? null });
    }
  }

  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url: baseUrl });
  await sleep(1000);
  const desktop = await cdp.evaluate(`(() => {
    const progressLabel = [...document.querySelectorAll("span")].find((element) => element.textContent?.trim() === "Work" && getComputedStyle(element).writingMode.includes("vertical"));
    const progressOwner = progressLabel?.parentElement?.parentElement;
    const explore = [...document.querySelectorAll("button, a")].find((element) => element.textContent?.includes("Explore Work"));
    return {
      progressVisibleAtHome: progressOwner ? getComputedStyle(progressOwner).display !== "none" : false,
      progressPosition: progressOwner ? getComputedStyle(progressOwner).position : null,
      exploreTag: explore?.tagName ?? null,
      exploreHref: explore?.getAttribute("href") ?? null,
    };
  })()`);
  check(!desktop.progressVisibleAtHome, "PROJECT_PROGRESS", desktop);
  await cdp.evaluate(`(() => { const explore = [...document.querySelectorAll("button, a")].find((element) => element.textContent?.includes("Explore Work")); explore?.click(); })()`);
  await sleep(150);
  const exploreResult = await cdp.evaluate(`({ fragment: location.hash, activeElement: document.activeElement?.id || document.activeElement?.textContent?.trim() || document.activeElement?.tagName, projectsTop: document.getElementById("projects")?.getBoundingClientRect().top ?? null, viewportHeight: innerHeight })`);
  check(exploreResult.fragment === "#projects" && exploreResult.projectsTop !== null && Math.abs(exploreResult.projectsTop) < exploreResult.viewportHeight && /projects/i.test(exploreResult.activeElement), "EXPLORE_WORK_ACTIVATION", exploreResult);

  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await cdp.send("Page.navigate", { url: baseUrl });
  await sleep(1000);
  const reducedMotion = await cdp.evaluate(`({ scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, lenisClass: document.documentElement.className, bouncingAnimations: document.getAnimations().map((animation) => animation.animationName).filter(Boolean) })`);
  check(reducedMotion.scrollBehavior !== "smooth" && reducedMotion.bouncingAnimations.length === 0 && !reducedMotion.lenisClass.includes("lenis"), "MOTION_PREFERENCE", reducedMotion);
} catch (error) {
  harnessError = error instanceof Error ? error.message : String(error);
  console.error("Browser exploration harness failed:", error, "\nServer output:\n", serverOutput);
} finally {
  cdp?.close();
  await terminate(browser);
  await terminate(server);
  fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

console.log(JSON.stringify({
  property: "Property 1: Bug Condition - All Audited Conditions Produce Correct Results",
  validates: "Requirements 1.2-1.12, 2.2-2.12",
  infrastructure: { browser: browserVersion, driver: "project-owned CDP harness", watch: false },
  observations,
  failures,
  harnessError,
}, null, 2));
if (harnessError) process.exitCode = 2;
else if (failures.length > 0) process.exitCode = 1;
