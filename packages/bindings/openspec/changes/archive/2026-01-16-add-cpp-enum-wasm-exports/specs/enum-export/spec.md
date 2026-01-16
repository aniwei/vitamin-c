## ADDED Requirements

### Requirement: C++ WASM 枚举导出
系统 SHALL 提供一个专用的 C++ 构建 WASM 模块，导出 `getEnums.ts` 所需的全部枚举数值。

#### Scenario: 从 C++ WASM 导出生成枚举
- **GIVEN** enum-export WASM 已构建且可用
- **WHEN** `getEnums.ts` 加载该模块
- **THEN** 它可以直接从模块导出读取所有枚举值，而不依赖 CanvasKit 导出

### Requirement: 原生源码位置
枚举导出 C++ 源码 MUST 存放在 `packages/bindings/native`。

#### Scenario: 源码位置可预测
- **WHEN** 开发者查找枚举导出实现
- **THEN** C++ 源码位于 `packages/bindings/native`

### Requirement: 构建脚本位置
enum-export WASM 的构建脚本 MUST 位于 `packages/bindings/scripts`，并产出一个 `getEnums.ts` 可解析的固定输出路径（可选环境变量覆写）。

#### Scenario: 构建流程包含在 bindings 内
- **GIVEN** bindings 包
- **WHEN** 运行 enum-export 构建脚本
- **THEN** 其产物输出到 `getEnums.ts` 使用的约定位置

### Requirement: 枚举生成使用 enum-export WASM
`getEnums.ts` SHALL 默认加载 enum-export WASM 作为枚举来源。

#### Scenario: 默认枚举生成路径
- **GIVEN** 未提供覆写参数
- **WHEN** `getEnums.ts` 运行
- **THEN** 它使用 enum-export WASM 的导出作为枚举值来源

### Requirement: EnumApi 替代 CanvasKitApi
系统 SHALL 提供 `EnumApi.ts`，以替代 `getEnums.ts` 中对 `CanvasKitApi` 的依赖。

#### Scenario: 使用 EnumApi 读取枚举
- **GIVEN** `EnumApi` 可用且已初始化
- **WHEN** `getEnums.ts` 读取枚举值
- **THEN** 通过 `EnumApi` 获取导出而非 `CanvasKitApi`
