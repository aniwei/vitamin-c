# Tests: add-cheap-webgl-multicontext-api

## 单元测试选项（按需求穷举）

### Requirement: 多 WebGL 上下文管理
- 新建上下文时返回唯一 ID，重复创建不会覆盖已有上下文
- 获取上下文时能返回对应的 WebGL 句柄与 Skia GPU context
- 销毁上下文后不可再获取，资源会被释放

### Requirement: 基于 @libmedia/cheap 的 WebGL 初始化
- 初始化时调用 cheap WebGL 入口并完成必要绑定
- WebGL 上下文切换时不会影响其他上下文状态

### Requirement: cheap C++ 绑定与 WASM 构建
- `canvaskit_cheap_bindings.cpp` 导出必要的 WebGL 绑定接口
- C++ 构建脚本输出 WASM 到 `packages/bindings/public`（支持环境变量覆写）
- 单元测试触发 `pnpm wasm:build` 并校验 `public/canvaskit_cheap.wasm` 生成

### Requirement: Skia 产物构建前置
- 单元测试在执行 `pnpm wasm:build` 之前先运行 `pnpm build` 以生成 `libskia.a`

### Requirement: wasm 调试构建选项
- 支持通过环境变量开启调试构建（含分离 DWARF）

### Requirement: Surface 创建与尺寸更新
- 针对指定上下文创建 on-screen Surface
- 在尺寸变更时能重建/刷新 Surface

### Requirement: WebGL API 导出
- `WebGLApi` 能在公共入口被导出并可被导入使用

## 已创建的单元测试
- `packages/bindings/src/__tests__/add-cheap-webgl-multicontext-api/webgl-api.test.ts`
- `packages/bindings/src/__tests__/add-cheap-webgl-multicontext-api/wasm-build.test.ts`

## 测试结果
- 状态：已通过
- 说明：在 `packages/bindings` 下执行 `pnpm vitest run src/__tests__/add-cheap-webgl-multicontext-api/wasm-build.test.ts --reporter=dot`。

## 需求复核（未通过时）
- 已通过测试，无需复核。
