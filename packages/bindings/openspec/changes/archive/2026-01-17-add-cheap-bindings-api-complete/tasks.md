## 1. 实现
- [x] 1.1 盘点 `packages/bindings/src/api/*` 所需的 wasm 导出列表（与 `canvaskit_bindings.cpp` 对齐）
- [x] 1.2 扩展 `canvaskit_cheap_bindings.cpp` 实现缺失导出（参考 `canvaskit_bindings.cpp`）
- [x] 1.3 更新 `buildCheapWasm.ts` 导出列表以覆盖新增 API
- [x] 1.4 校验 TypeScript API 与导出一致（必要时补齐 wrapper）
- [x] 1.5 更新/补充文档说明（若有）

## 2. 单元测试
- [x] 2.1 在 `packages/bindings/src/__tests__/add-cheap-bindings-api-complete/` 添加单元测试文件
- [x] 2.2 新增 `tests.md`，枚举测试选项并记录执行状态
- [x] 2.3 运行单元测试并更新 `tests.md` 结果

## 3. 校验
- [x] 3.1 运行 `openspec validate add-cheap-bindings-api-complete --strict --no-interactive`
