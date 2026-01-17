# Tests: add-cheap-bindings-api-complete

## 单元测试选项（按需求穷举）

### Requirement: cheap bindings 覆盖 api 导出
- cheap wasm 具备 `packages/bindings/src/api/*` 所需导出（存在性检查）
- 关键 API（Surface/Canvas/Paint/Path/Image 等）可以在 cheap wasm 下调用并返回有效指针

### Requirement: 构建导出列表同步
- `buildCheapWasm.ts` 导出列表包含新增 API

## 已创建的单元测试
- `packages/bindings/src/__tests__/add-cheap-bindings-api-complete/cheap-api.test.ts`

## 测试结果
- 状态：通过
- 说明：`pnpm test -- src/__tests__/add-cheap-bindings-api-complete/cheap-api.test.ts`

## 需求复核（未通过时）
- 待执行测试后复核。
