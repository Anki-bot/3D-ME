import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./audit-model.mjs";

const chrome =
  process.env.PORTFOLIO_AUDIT_CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const appPort = 4321;
const debugPort = 9331;
const baseUrl = `http://127.0.0.1:${appPort}`;
const viewports = [
  { name: "minimum-phone", width: 320, height: 568 },
  { name: "phone", width: 375, height: 667 },
  { name: "below-sm", width: 639, height: 800 },
  { name: "at-sm", width: 640, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "wide-desktop", width: 1440, height: 1000 },
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
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
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

  async press(key, code, virtualKeyCode) {
    const event = { key, code, windowsVirtualKeyCode: virtualKeyCode };
    await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...event });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...event });
    await sleep(30);
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
  path.join(os.tmpdir(), "portfolio-navigation-chrome-"),
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

  for (const viewport of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 600,
    });
    await cdp.send("Page.navigate", { url: baseUrl });
    await sleep(900);

    const geometry = await cdp.evaluate(`(() => {
      document.documentElement.style.setProperty("overflow-x", "visible", "important");
      document.body.style.setProperty("overflow-x", "visible", "important");

      const pill = document.querySelector("header > div");
      const logo = document.querySelector('header > div > a[href="#home"]');
      const list = document.querySelector("header nav ul");
      const links = [...document.querySelectorAll("header nav a")];
      if (!pill || !logo || !list || links.length !== 3) return null;

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
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          style.pointerEvents !== "none" &&
          rect.width > 0 &&
          rect.height > 0;
      };
      const pillRect = serializeRect(pill);
      const pillStyle = getComputedStyle(pill);
      const listStyle = getComputedStyle(list);
      const logoStyle = getComputedStyle(logo);
      const firstLinkStyle = getComputedStyle(links[0]);

      return {
        viewport: { width: innerWidth, height: innerHeight },
        overflowOverride: {
          html: getComputedStyle(document.documentElement).overflowX,
          body: getComputedStyle(document.body).overflowX,
        },
        pill: pillRect,
        logo: { ...serializeRect(logo), visible: isVisible(logo) },
        links: links.map((link) => ({
          href: link.getAttribute("href"),
          label: link.textContent?.trim(),
          tabIndex: link.tabIndex,
          visible: isVisible(link),
          ...serializeRect(link),
        })),
        styles: {
          pillGap: pillStyle.columnGap,
          pillPaddingInline: pillStyle.paddingInlineStart,
          pillPaddingBlock: pillStyle.paddingBlockStart,
          listGap: listStyle.columnGap,
          logoFontSize: logoStyle.fontSize,
          linkFontSize: firstLinkStyle.fontSize,
        },
      };
    })()`);

    check(Boolean(geometry), "NAV_VIEWPORT", { viewport, reason: "navigation missing" });
    if (!geometry) continue;

    const tolerance = 0.5;
    const insideViewport = (rect) =>
      rect.left >= -tolerance && rect.right <= viewport.width + tolerance;
    const insidePill = (rect) =>
      rect.left >= geometry.pill.left - tolerance &&
      rect.right <= geometry.pill.right + tolerance;

    check(
      geometry.overflowOverride.html === "visible" &&
        geometry.overflowOverride.body === "visible",
      "NAV_OVERFLOW_INDEPENDENCE",
      { viewport, overflowOverride: geometry.overflowOverride },
    );
    check(
      insideViewport(geometry.pill) && geometry.pill.width <= viewport.width,
      "NAV_VIEWPORT",
      { viewport, pill: geometry.pill },
    );
    check(
      geometry.logo.visible &&
        insideViewport(geometry.logo) &&
        insidePill(geometry.logo),
      "NAV_LOGO_VIEWPORT",
      { viewport, pill: geometry.pill, logo: geometry.logo },
    );
    check(
      JSON.stringify(geometry.links.map(({ href }) => href)) ===
        JSON.stringify(["#home", "#about", "#projects"]),
      "NAV_DESTINATIONS",
      { viewport, links: geometry.links },
    );
    check(
      geometry.links.every(
        (link) =>
          link.visible &&
          link.tabIndex === 0 &&
          insideViewport(link) &&
          insidePill(link),
      ),
      "NAV_VIEWPORT",
      { viewport, pill: geometry.pill, links: geometry.links },
    );

    const focusOrder = [];
    for (let index = 0; index < 4; index += 1) {
      await cdp.press("Tab", "Tab", 9);
      focusOrder.push(
        await cdp.evaluate(
          "document.activeElement?.getAttribute('href') ?? null",
        ),
      );
    }

    const activationFocus = [];
    const activatedFragments = [];
    for (const href of ["#home", "#about", "#projects"]) {
      activationFocus.push(
        await cdp.evaluate(`(() => {
          history.replaceState(null, "", location.pathname);
          const link = document.querySelector('header nav a[href="${href}"]');
          link?.focus();
          return document.activeElement === link;
        })()`),
      );
      await cdp.press("Enter", "Enter", 13);
      activatedFragments.push(await cdp.evaluate("location.hash"));
    }

    check(
      JSON.stringify(focusOrder) ===
        JSON.stringify(["#home", "#home", "#about", "#projects"]),
      "NAV_KEYBOARD_FOCUS",
      { viewport, focusOrder },
    );
    check(
      activationFocus.every(Boolean) &&
        JSON.stringify(activatedFragments) ===
          JSON.stringify(["#home", "#about", "#projects"]),
      "NAV_KEYBOARD_ACTIVATION",
      { viewport, activationFocus, activatedFragments },
    );

    if (viewport.name === "minimum-phone") {
      check(
        JSON.stringify(geometry.styles) ===
          JSON.stringify({
            pillGap: "12px",
            pillPaddingInline: "12px",
            pillPaddingBlock: "12px",
            listGap: "12px",
            logoFontSize: "18px",
            linkFontSize: "11px",
          }),
        "NAV_COMPACT_STYLING",
        { viewport, styles: geometry.styles },
      );
    }
    if (viewport.name === "wide-desktop") {
      check(
        JSON.stringify(geometry.styles) ===
          JSON.stringify({
            pillGap: "48px",
            pillPaddingInline: "32px",
            pillPaddingBlock: "16px",
            listGap: "40px",
            logoFontSize: "20px",
            linkFontSize: "14px",
          }),
        "NAV_WIDE_STYLE_PRESERVATION",
        { viewport, styles: geometry.styles },
      );
    }

    observations.push({
      viewport: viewport.name,
      geometry,
      focusOrder,
      activatedFragments,
    });
  }
} catch (error) {
  harnessError = error instanceof Error ? error.message : String(error);
  console.error(
    "Responsive navigation browser harness failed:",
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
        "Property 1: Bug Condition - Navigation is contained at supported viewport widths",
      validates: "Requirements 1.6, 2.6, 3.3, 3.4, 3.8, 3.10",
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
