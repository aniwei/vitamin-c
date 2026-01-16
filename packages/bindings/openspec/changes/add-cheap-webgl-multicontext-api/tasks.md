## 1. 实现
- [ ] 1.1 新增 `WebGLApi.ts`，定义多上下文注册/获取/销毁接口
- [ ] 1.2 集成 `@libmedia/cheap` WebGL 运行时，完成上下文创建与绑定
- [ ] 1.3 为每个上下文创建对应的 Skia GPU context 与 on-screen Surface
- [ ] 1.4 新增 `canvaskit_cheap_bindings.cpp`，参考 `canvaskit_bindings.cpp` 实现 cheap WebGL 绑定
- [ ] 1.5 新增 C++ 编译脚本，构建 cheap bindings WASM 并接入流程
- [ ] 1.6 将 WebGL API 暴露在 `src/api` 或入口导出
- [ ] 1.7 补充必要的文档/示例（若有）

## 2. 单元测试
- [ ] 2.1 在 `packages/bindings/__tests__/add-cheap-webgl-multicontext-api/` 添加单元测试文件
- [ ] 2.2 新增 `tests.md`，枚举测试选项并记录执行状态
- [ ] 2.3 运行单元测试并更新 `tests.md` 结果

## 3. 校验
- [ ] 3.1 运行 `openspec validate add-cheap-webgl-multicontext-api --strict --no-interactive`
