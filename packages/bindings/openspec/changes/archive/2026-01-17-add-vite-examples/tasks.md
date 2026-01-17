## 1. 设计与规划
- [x] 1.1 盘点需要覆盖的 Vite 接口/入口（含 WebGL/WebGPU/Canvas/Surface/Paragraph/Filters 等）
- [x] 1.2 明确 examples 目录结构与入口规范

## 2. 实现
- [x] 2.1 添加 Vite examples 与入口文件
- [x] 2.2 确保 examples 可加载 canvaskit_cheap.wasm 并运行
- [x] 2.3 更新 README 或说明文档（如需要）

## 3. 单元测试
- [x] 3.1 在 `packages/bindings/src/__tests__/add-vite-examples/` 添加测试（如适用）
- [x] 3.2 更新 `tests.md` 记录测试选项与结果

## 4. 校验
- [x] 4.1 运行 `openspec validate add-vite-examples --strict --no-interactive`
