# Change: 基于 @libmedia/cheap 的多 context WebGLApi

## Why
当前 bindings 缺少一个面向 @libmedia/cheap 的 WebGL API 层，且仅能隐式使用单一上下文。需要一个明确的 WebGLApi 来管理多个 WebGL 上下文，映射到各自的 Skia GPU context，参考 CanvasKit WebGL 初始化与 Surface 创建逻辑。

## What Changes
- 新增 `WebGLApi.ts`，封装基于 `@libmedia/cheap` 的 WebGL 上下文创建与管理，并支持多上下文并存。
- 为每个 WebGL 上下文创建并维护对应的 Skia GPU context/Surface，参考 `canvaskit_bindings.cpp` 的 WebGL 创建路径。
- 新增 `canvaskit_cheap_bindings.cpp`，参考 `canvaskit_bindings.cpp` 实现 cheap 版本 WebGL 绑定。
- 新增 C++ 编译脚本，编译 `canvaskit_cheap_bindings.cpp` 为 WASM 产物并接入构建流程，确保成功构建并输出到 `packages/bindings/public`。
- 将 cheap WASM 构建产物接入单元测试，验证可成功构建并生成输出文件。
- 在 `bindings` 的 `build` 流程中先构建 Skia 产物，作为 wasm 构建测试的前置条件。
- wasm 构建增加调试功能选项（含分离 DWARF），用于 Chrome WASM 调试工作流。
- 在 `src/api` 或相关入口导出新的 WebGL API 供调用方使用。

## Impact
- Affected specs: `webgl-api`（新增）
- Affected code: `packages/bindings/src/WebGLApi.ts`、`packages/bindings/src/api/*`、`packages/bindings/src/CanvasKitApi.ts`（如需接入）、`packages/bindings/native/canvaskit_cheap_bindings.cpp`、`packages/bindings/scripts/*`
