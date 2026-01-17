# cheap-bindings-api Specification

## Purpose
TBD - created by archiving change add-cheap-bindings-api-complete. Update Purpose after archive.
## Requirements
### Requirement: cheap bindings 覆盖 api 导出
系统 SHALL 使 `canvaskit_cheap_bindings.cpp` 覆盖 `packages/bindings/src/api/*` 所需的 wasm 导出，并与 `canvaskit_bindings.cpp` 对齐。

#### Scenario: 导出存在性
- **WHEN** 使用 cheap wasm 初始化 `CanvasKitApi`
- **THEN** `api/*` 所需的导出均可被解析

### Requirement: 构建导出列表同步
系统 SHALL 更新 `buildCheapWasm.ts` 的导出列表以包含新增 cheap bindings API。

#### Scenario: 导出列表与实现一致
- **WHEN** 构建 cheap wasm
- **THEN** 输出包含新增导出且可通过调用验证

