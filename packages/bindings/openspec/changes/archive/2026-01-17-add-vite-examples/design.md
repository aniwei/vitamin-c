# Design: add-vite-examples

## 目录结构
- 提供统一的 examples 目录与入口索引，便于新增/扩展。
- 每个示例保持最小依赖与清晰的初始化流程。

## wasm 加载
- 示例通过统一 helper 加载 `canvaskit_cheap.wasm`，避免重复逻辑。
- 保持与生产加载方式一致，确保可复用。
