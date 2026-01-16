# 变更：使用 C++ WASM 导出 getEnums.ts 所需枚举

## Why
当前 `getEnums.ts` 依赖 CanvasKit WASM 导出枚举值，容易受到 CanvasKit 产物差异影响。需要一个专用、稳定的 C++ WASM 模块，仅导出所需枚举值，使生成流程可控且可复现。

## What Changes
- 在 `packages/bindings/native` 新增 C++ 源文件，导出 `getEnums.ts` 所需的全部枚举值。
- 在 `packages/bindings/scripts` 新增构建脚本，编译上述 C++ 源码并产出 WASM。
- 新增 `EnumApi.ts`，替换 `getEnums.ts` 中对 `CanvasKitApi` 的依赖，用于加载并读取枚举导出。
- 更新 `getEnums.ts`，默认加载 enum-export WASM（支持路径/环境变量覆写）。

## 影响范围
- 受影响 specs：`enum-export`（新增）
- 受影响代码：`packages/bindings/native/*`、`packages/bindings/scripts/*`、`packages/bindings/src/EnumApi.ts`、`packages/bindings/scripts/getEnums.ts`、`packages/bindings/package.json`
