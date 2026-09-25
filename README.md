# Immersive Portfolio 🌌

*A cinematic, WebGL-enhanced creative developer portfolio built with Next.js 16, React Three Fiber, custom GLSL shaders, and GSAP.*

**🌍 Live Experience:** [Insert your Vercel URL here]

## 📖 Overview
An interactive single-page portfolio engineered for high-craft storytelling, spatial depth, and strict accessibility compliance. The architecture pairs server-rendered semantic content with lazy-loaded 3D WebGL scenes, scroll-driven GLSL shader transitions, and a deterministic capability gate that adapts automatically to device performance and reduced-motion preferences.

## ✨ Key Features
* **3D WebGL Hero & About Scenes:** Procedural Three.js / React Three Fiber geometries (`Icosahedron` and orbital rings) with physical transmission materials, mouse parallax, and scroll-linked offsets.
* **Custom GLSL Shader Showcase:** Desktop pinned scroll mode (`300vh`) featuring custom vertex and fragment shaders for wave displacement, alongside an automatic normal-flow fallback for mobile and compact viewports (`<1024px` width or `<720px` height).
* **Capability & Motion Gating:** Reactive hooks (`useHero3DEligibility`, `useReducedMotion`, `useFinePointer`) that pause WebGL render loops offscreen, handle WebGL context loss/restoration, and respect `prefers-reduced-motion`.
* **Dynamic Dual Theme System:** Context-driven Dark/Light mode architecture with custom interactive SVG/Image toggles and persistent `localStorage` state.
* **Automated Release & Audit Harness:** Built-in preflight release validation (`scripts/release-check.mjs`) and a zero-dependency test suite using `node:test`, seeded property-based generators, and a headless Chrome DevTools Protocol (CDP) browser harness.

## 🛠 Tech Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **3D & Shaders** | Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, Custom GLSL |
| **Motion & Scroll** | GSAP 3, ScrollTrigger, Lenis Smooth Scroll, Framer Motion |
| **Styling** | Tailwind CSS 4, PostCSS |
| **Testing & QA** | Node Test Runner (`node:test`), Custom Property Generators, Chrome CDP Harness |

## 🚀 Local Development

Requires **Node.js 24.x** (pinned in `.nvmrc`) and **npm 11.x**.

```bash
# Use the pinned Node version
nvm use

# Install dependencies
npm install

# Start the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing & Release Validation

```bash
# Run lint checks
npm run lint

# Run release build preflight & artifact validation tests
npm run test:release-build

# Run preservation unit & property test suites
npm run test:preservation

# Create a validated production webpack build
npm run build
```

## 📂 Project Architecture
* `src/app/`: Next.js App Router root layout, global styles, and main page composition.
* `src/components/`: Modular UI and 3D boundaries (`Hero`, `About`, `Projects`, `SolarSystem`, `Navigation`, `Theme`, `Cursor`, `Layout`).
* `src/config/`: Centralized configuration registries and pure eligibility selectors for 3D scenes (`hero3d.ts`, `projects3d.ts`).
* `src/hooks/`: Custom hooks for GSAP timelines, ScrollTrigger pinning, media queries, and hardware capability detection.
* `scripts/`: Production preflight and build artifact verification (`release-check.mjs`).
* `test/`: Automated unit, property-based, and headless browser regression suites.