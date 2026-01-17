## Context
`canvaskit_cheap_bindings.cpp` 目前仅覆盖 WebGL 相关接口，`api/*` 中大量导出仍依赖完整 CanvasKit bindings。需要补齐 cheap bindings 以覆盖 api 层使用。

## Goals / Non-Goals
- Goals:
  - cheap wasm 覆盖 `packages/bindings/src/api/*` 所需导出
  - 输出导出列表与 api 层保持一致
- Non-Goals:
  - 不引入新的 API 形态
  - 不在此变更中引入 WebGPU 之外的新后端

## Decisions
- 以 `canvaskit_bindings.cpp` 为对齐基准补齐 cheap bindings
- 通过 `buildCheapWasm.ts` 集中维护导出清单

## Risks / Trade-offs
- cheap bindings 增量较大，需谨慎同步导出与类型
- 构建时间增加，需要通过测试覆盖关键路径

## Migration Plan
- 首先补齐导出与构建
- 再在 TypeScript 层校验并补充 wrapper

## Open Questions
- 是否需要明确“最小 cheap API 集合”的范围边界？
