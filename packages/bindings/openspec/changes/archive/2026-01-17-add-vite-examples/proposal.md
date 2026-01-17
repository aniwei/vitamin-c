# Change: add-vite-examples

## Why
需要为各类 Vite 接口/入口提供可运行的 examples，用于验证 wasm/绑定能力与使用方式。

## What Changes
- 新增 Vite 示例页面与入口，覆盖主要接口（如 Canvas/Surface/WebGL/WebGPU/Paragraph/Filters 等）。
- 为 examples 提供统一的加载与运行结构，便于复用与扩展。
- 补充变更规格与测试说明。

## Impact
- Affected specs: vite-examples
- Affected code: packages/bindings 下的 Vite examples 与相关入口文件
