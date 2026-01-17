# Change: 补全 cheap bindings 以覆盖 api 接口

## Why
当前 `canvaskit_cheap_bindings.cpp` 仅实现 WebGL 相关最小集，`packages/bindings/src/api/*` 的其他接口仍依赖完整 CanvasKit bindings。需要参考 `canvaskit_bindings.cpp` 补齐 cheap bindings，使 api 层接口在 cheap wasm 下可用。

## What Changes
- 参考 `canvaskit_bindings.cpp`，补全 `canvaskit_cheap_bindings.cpp` 的 C++ 导出，覆盖 `packages/bindings/src/api/*` 所需的接口。
- 更新 cheap wasm 构建脚本导出列表以包含新增 API。
- 视需要补充 TypeScript 层的导出与类型对齐（不改变既有 API 形态）。
- 增加/更新单元测试以验证 cheap wasm 可覆盖新增 API 导出。

## Impact
- Affected specs: `cheap-bindings-api`（新增）
- Affected code: `packages/bindings/native/canvaskit_cheap_bindings.cpp`、`packages/bindings/scripts/buildCheapWasm.ts`、`packages/bindings/src/api/*`、`packages/bindings/src/CanvasKitApi.ts`
