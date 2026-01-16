## Context
需要一个基于 `@libmedia/cheap` 的 WebGL API 层，参考 CanvasKit 的 WebGL 初始化与 Surface 构建逻辑，并支持多上下文并存。

## Goals / Non-Goals
- Goals:
  - 提供多 WebGL 上下文管理 API（创建、获取、销毁）
  - 为每个上下文维护独立的 Skia GPU context 与 on-screen Surface
  - Node/Browser 环境下尽可能保持一致的调用方式
- Non-Goals:
  - 不在此变更中引入 WebGPU
  - 不在此变更中改造现有 CanvasKitApi 的核心初始化流程（除非必须）

## Decisions
- 使用上下文注册表管理 contextId -> {gl, grContext, surface} 的映射
- WebGL 初始化与 Surface 创建逻辑参考 `canvaskit_bindings.cpp` 的 `MakeGrContext` / `MakeOnScreenGLSurface`
- 新增 `canvaskit_cheap_bindings.cpp` 作为 cheap 运行时的 C++ 绑定入口
- 通过独立构建脚本编译 C++ 绑定为 WASM，便于接入与复用
- 对外暴露 `WebGLApi`，避免将多上下文逻辑混入现有 API 层

## Risks / Trade-offs
- 多上下文并存可能增加资源占用，需要提供显式销毁路径
- 不同运行时的 WebGL 行为差异可能影响稳定性

## Migration Plan
- 初始引入 WebGLApi，不改变现有软件渲染路径
- 逐步在需要多上下文的调用方中接入

## Open Questions
- 是否需要统一的上下文切换/绑定钩子以兼容外部 GL 状态管理？
- WebGL1/WebGL2 的能力差异是否需要显式配置项？
