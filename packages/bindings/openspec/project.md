# Project Context

## Purpose
This package provides TypeScript bindings around CanvasKit (Skia) WebAssembly, built on the `@libmedia/cheap` runtime. It exposes a typed, ergonomic API for core drawing primitives (e.g., `Path`, `Paint`, `Surface`, `Canvas`) and manages low-level WASM memory and imports so higher-level packages can use Skia from Node or the browser.

## Tech Stack
- TypeScript (ES2020, ESM output)
- WebAssembly (CanvasKit/Skia)
- `@libmedia/cheap` (WASM runtime)
- Node.js (build, smoke tests)
- pnpm workspace
- Vitest (tests)
- tsx (scripts)

## Project Conventions

### Code Style
- Use 2-space indentation, single quotes, and trailing commas; semicolons are generally omitted.
- Prefer `const` and `let`; avoid `var`.
- Keep APIs typed and explicit. Use the `Ptr` type alias for WASM pointers.
- Normalize numeric arguments with `| 0` (int) or `>>> 0` (uint) when passing into WASM.
- Use `invariant()` for runtime preconditions, and `globalThis` for environment checks.
- Prefer private class fields (`#field`) and small focused classes.

### Architecture Patterns
- `WasmApi` owns WASM lifecycle: loading, exports resolution, memory helpers, and Emscripten imports.
- `CanvasKitApi` is a singleton facade that initializes once and exposes typed APIs.
- `src/api/*` contains thin wrappers for Skia/CanvasKit APIs (Path, Paint, Surface, etc.).
- Environment detection (Node vs browser) gates file/URL loading and optional WebGL/WebGPU paths.
- Backend surfaces support software rasterization as well as WebGL and WebGPU.

### Testing Strategy
- `pnpm test` runs Vitest in Node with `vitest.setup.ts` polyfilling `requestIdleCallback`.
- GPU tests are optional via `pnpm test:gpu` (requires `RUN_BROWSER_GPU_TESTS=1` and a Chromium browser via Puppeteer).
- `pnpm smoke` builds and runs `dist/smoke.js` against a local CanvasKit WASM file.

### Git Workflow
- No package-specific branching or commit rules are defined here. Follow repo/team conventions and keep commits small and descriptive.

## Domain Context
- CanvasKit is the WebAssembly build of Skia. Most APIs map to Skia concepts (Path, Paint, Shader, Surface).
- The runtime and module loading are based on `@libmedia/cheap`.
- Rendering backends include software, WebGL, and WebGPU; API layers expose helpers for each.
- Many calls require manual WASM memory management; callers must `malloc`/`free` as needed.
- The API is designed to be low-level and close to the underlying CanvasKit exports.

## Important Constraints
- `CanvasKitApi.ready()` must be called before using any API.
- A valid WASM path/URI is required; default smoke test path expects `third-party/skia` output.
- Keep Node/browser compatibility: avoid DOM-only globals and guard environment-specific logic.
- WebGL/WebGPU usage requires a browser or a Node environment with appropriate GPU/driver support.

## External Dependencies
- CanvasKit/Skia WASM (from `third-party/skia` output or the `canvaskit-wasm` package).
- `@libmedia/cheap` (WASM runtime utilities) and `geometry` (workspace dependency).
- Puppeteer for browser-based GPU tests.
