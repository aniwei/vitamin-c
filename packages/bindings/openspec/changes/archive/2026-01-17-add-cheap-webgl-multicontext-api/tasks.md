## 1. 实现
- [x] 1.1 新增 `WebGLApi.ts`，定义多上下文注册/获取/销毁接口
- [x] 1.2 集成 `@libmedia/cheap` WebGL 运行时，完成上下文创建与绑定
- [x] 1.3 为每个上下文创建对应的 Skia GPU context 与 on-screen Surface
- [x] 1.4 新增 `canvaskit_cheap_bindings.cpp`，参考 `canvaskit_bindings.cpp` 实现 cheap WebGL 绑定
- [x] 1.5 新增 C++ 编译脚本，构建 cheap bindings WASM 并接入流程（输出到 `packages/bindings/public`）
- [x] 1.6 将 WebGL API 暴露在 `src/api` 或入口导出
- [x] 1.7 在 `bindings` 的 `build` 流程中加入 Skia 构建产物步骤
- [x] 1.8 增加 wasm 调试构建选项（含分离 DWARF）
- [x] 1.9 补充必要的文档/示例（若有）

## 2. 单元测试
- [x] 2.1 在 `packages/bindings/src/__tests__/add-cheap-webgl-multicontext-api/` 添加单元测试文件
- [x] 2.2 新增 `tests.md`，枚举测试选项并记录执行状态
- [x] 2.3 接入 cheap WASM 构建测试（验证输出到 `packages/bindings/public`）
- [x] 2.4 运行单元测试并更新 `tests.md` 结果（包含 `pnpm build` 前置）

## 3. 校验
- [x] 3.1 运行 `openspec validate add-cheap-webgl-multicontext-api --strict --no-interactive`
