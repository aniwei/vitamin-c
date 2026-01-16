# Tests: add-cpp-enum-wasm-exports

## 单元测试选项（按需求穷举）

### Requirement: C++ WASM 枚举导出
- `getEnums.ts` 调用 `EnumApi.invoke` 读取所需导出（使用 mock）
- `EnumApi.ready` 按环境变量/默认路径加载 enum-export WASM（使用 mock）
- 当 `EnumApi.ready` 失败时，脚本记录告警并不中断现有枚举文件写入

### Requirement: 原生源码位置
- `buildEnumWasm.ts` 在缺失 `packages/bindings/native/enum_exports.cpp` 时抛出错误

### Requirement: 构建脚本位置
- `buildEnumWasm.ts` 输出路径固定为 `packages/bindings/native/enum-exports.wasm`

### Requirement: 枚举生成使用 enum-export WASM
- 未设置环境变量时，`getEnums.ts` 默认使用 `native/enum-exports.wasm`
- 设置 `ENUM_EXPORT_WASM` 时优先生效
- 设置 `ENUM_WASM` 且 `ENUM_EXPORT_WASM` 未设置时生效

### Requirement: EnumApi 替代 CanvasKitApi
- `EnumApi.ready` 在缺少 `uri/path` 时抛出错误
- `EnumApi.invoke` / `EnumApi.hasExport` 在未初始化时抛出错误

## 已创建的单元测试
- `__tests__/add-cpp-enum-wasm-exports/enum-api.test.ts`
- `__tests__/add-cpp-enum-wasm-exports/get-enums-script.test.ts`

## 测试结果
- 状态：已通过
- 说明：在 `packages/bindings` 下执行 `pnpm vitest run src/__tests__/add-cpp-enum-wasm-exports/enum-api.test.ts src/__tests__/add-cpp-enum-wasm-exports/get-enums-script.test.ts`。

## 需求复核（未通过时）
- 已复核需求与测试选项映射关系，未发现冲突或缺失。
- 仍需执行测试以确认实现满足需求。
