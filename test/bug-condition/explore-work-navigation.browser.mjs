import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./audit-model.mjs";

const chrome =
  process.env.PORTFOLIO_AUDIT_CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const appPort = 4318;
const debugPort = 9328;
const baseUrl = `http://localhost:${appPort}`;
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
      throw new Error(
        result.exceptionDetails.exception?.description ??
          result.result?.description ??
          result.exceptionDetails.text,
      );
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

function setupExpression(focusExploreFirst) {
  return `(() => {
    const explore = [...document.querySelectorAll('a[href="#projects"]')]
      .find((element) => element.textContent?.includes("Explore Work"));
    const work = [...document.querySelectorAll('nav a[href="#projects"]')]
      .find((element) => element.textContent?.trim() === "Work");
    const heading = document.getElementById("projects-heading");
    if (!explore || !work || !heading) return null;
    ${focusExploreFirst ? "explore.focus();" : ""}
    window.__exploreNavigationAudit = { scrollCalls: [], focusCalls: [] };
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      window.__exploreNavigationAudit.scrollCalls.push({
        targetId: this.id,
        behavior: options?.behavior ?? null,
        block: options?.block ?? null,
      });
      return nativeScrollIntoView.call(this, options);
    };
    const nativeFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (options) {
      window.__exploreNavigationAudit.focusCalls.push({
        targetId: this.id,
        preventScroll: options?.preventScroll ?? false,
      });
      return nativeFocus.call(this, options);
    };
    const rect = explore.getBoundingClientRect();
    return {
      exploreTag: explore.tagName,
      exploreHref: explore.getAttribute("href"),
      workTag: work.tagName,
      workHref: work.getAttribute("href"),
      headingTabIndex: heading.tabIndex,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  })()`;
}

async function activationResult(cdp) {
  return cdp.evaluate(`(() => {
    const projects = document.getElementById("projects");
    return {
      fragment: location.hash,
      activeElement: {
        id: document.activeElement?.id ?? null,
        tag: document.activeElement?.tagName ?? null,
        text: document.activeElement?.textContent?.trim() ?? null,
      },
      projectsTop: projects?.getBoundingClientRect().top ?? null,
      viewportHeight: innerHeight,
      audit: window.__exploreNavigationAudit,
    };
  })()`);
}

function assertActivation(result, expectedBehavior) {
  const evidence = JSON.stringify(result);
  assert.equal(result.fragment, "#projects", evidence);
  assert.equal(result.activeElement.id, "projects-heading", evidence);
  assert.ok(
    result.projectsTop !== null && Math.abs(result.projectsTop) < result.viewportHeight,
    `Projects was not reached: ${JSON.stringify(result)}`,
  );
  assert.deepEqual(result.audit.scrollCalls, [
    { targetId: "projects", behavior: expectedBehavior, block: "start" },
  ]);
  assert.deepEqual(result.audit.focusCalls, [
    { targetId: "projects-heading", preventScroll: true },
  ]);
}

if (!fs.existsSync(chrome)) {
  throw new Error(
    `Chrome executable not found at ${chrome}; set PORTFOLIO_AUDIT_CHROME`,
  );
}

const server = spawn(
  path.join(root, "node_modules/.bin/next"),
  ["dev", "--webpack", "-p", String(appPort)],
  {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});

const userDataDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "portfolio-explore-work-chrome-"),
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

let cdp;
try {
  await waitFor(baseUrl);
  const targets = await (
    await waitFor(`http://127.0.0.1:${debugPort}/json/list`)
  ).json();
  const target = targets.find((candidate) => candidate.type === "page");
  assert.ok(target, "Chrome exposed no page target");

  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await cdp.send("Page.navigate", { url: baseUrl });
  await sleep(1_200);
  const pointerSetup = await cdp.evaluate(setupExpression(false));
  assert.deepEqual(
    {
      exploreTag: pointerSetup?.exploreTag,
      exploreHref: pointerSetup?.exploreHref,
      workTag: pointerSetup?.workTag,
      workHref: pointerSetup?.workHref,
      headingTabIndex: pointerSetup?.headingTabIndex,
    },
    {
      exploreTag: "A",
      exploreHref: "#projects",
      workTag: "A",
      workHref: "#projects",
      headingTabIndex: -1,
    },
  );
  const x = pointerSetup.rect.x + pointerSetup.rect.width / 2;
  const y = pointerSetup.rect.y + pointerSetup.rect.height / 2;
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await sleep(1_200);
  assertActivation(await activationResult(cdp), "smooth");

  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cdp.send("Page.navigate", { url: baseUrl });
  await sleep(1_000);
  const keyboardSetup = await cdp.evaluate(setupExpression(true));
  assert.equal(keyboardSetup?.exploreTag, "A");
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
  await sleep(150);
  assertActivation(await activationResult(cdp), "instant");

  console.log(
    JSON.stringify({
      property: "Property 1: accessible Explore Work navigation",
      validates: "Requirements 1.4, 2.4, 3.3, 3.4, 3.10",
      pointerBehavior: "smooth",
      keyboardReducedMotionBehavior: "instant",
      duplicateScrollCalls: 0,
    }),
  );
} catch (error) {
  console.error(error, "\nServer output:\n", serverOutput);
  process.exitCode = 1;
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
