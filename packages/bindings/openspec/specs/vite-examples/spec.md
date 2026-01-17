# vite-examples Specification

## Purpose
TBD - created by archiving change add-vite-examples. Update Purpose after archive.
## Requirements
### Requirement: Vite examples 覆盖主要接口
系统 SHALL 提供 Vite examples，覆盖 bindings 主要接口的示例入口。

#### Scenario: 接口覆盖
- **WHEN** 访问 examples 索引
- **THEN** 可看到各接口对应的示例入口

### Requirement: examples 可加载 cheap wasm
系统 SHALL 确保示例可加载 `canvaskit_cheap.wasm` 并完成初始化。

#### Scenario: wasm 初始化
- **WHEN** 打开任意示例页面
- **THEN** 示例成功初始化 CanvasKit 并执行核心调用

