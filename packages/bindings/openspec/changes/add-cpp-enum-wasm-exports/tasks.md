## 1. 实现
- [x] 在 `packages/bindings/native` 定义 C++ 枚举导出模块，为 `getEnums.ts` 所需的全部枚举提供稳定的 C ABI 导出。
- [x] 在 `packages/bindings/scripts` 添加构建脚本，编译 C++ 模块为 WASM，并明确输出路径/环境变量覆写。
- [x] 新增 `packages/bindings/src/EnumApi.ts`，用于加载 enum-export WASM 并读取枚举值。
- [x] 更新 `packages/bindings/scripts/getEnums.ts`，改用 `EnumApi` 获取枚举导出。
- [x] 按需更新 `packages/bindings/package.json` 脚本以纳入新的构建步骤。
- [x] 视需要补充/调整枚举生成流程文档。

## 2. 校验
- [x] 运行 `openspec validate add-cpp-enum-wasm-exports --strict --no-interactive`

## 3. 单元测试
- [x] 在项目根目录创建 `__tests__/add-cpp-enum-wasm-exports/` 并补充单元测试文件
- [x] 新增 `tests.md`，枚举测试选项并记录执行状态
- [x] 运行相关单元测试并更新 `tests.md` 结果
