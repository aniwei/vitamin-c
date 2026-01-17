## ADDED Requirements

### Requirement: 多 WebGL 上下文管理
系统 SHALL 提供 `WebGLApi` 来创建、获取与销毁多个 WebGL 上下文，并保证上下文之间的资源隔离。

#### Scenario: 创建与获取上下文
- **WHEN** 调用方创建新的 WebGL 上下文
- **THEN** 返回唯一的上下文标识符并可再次通过该标识符获取上下文对象

#### Scenario: 销毁上下文
- **GIVEN** 一个已创建的上下文标识符
- **WHEN** 调用方销毁该上下文
- **THEN** 该上下文的资源被释放且后续无法获取

### Requirement: 基于 @libmedia/cheap 的 WebGL 初始化
系统 SHALL 使用 `@libmedia/cheap` 的 WebGL 运行时来创建并绑定 WebGL 上下文。

#### Scenario: cheap 初始化被调用
- **WHEN** `WebGLApi` 创建 WebGL 上下文
- **THEN** 必须通过 `@libmedia/cheap` 的 WebGL 初始化路径完成绑定

### Requirement: cheap C++ 绑定与 WASM 构建
系统 SHALL 提供 `canvaskit_cheap_bindings.cpp` 并通过构建脚本编译为 WASM 产物，用于 cheap WebGL 绑定入口。

#### Scenario: C++ 绑定被编译为 WASM
- **GIVEN** `canvaskit_cheap_bindings.cpp` 已实现
- **WHEN** 运行对应的 C++ 构建脚本
- **THEN** 生成可供加载的 WASM 产物并输出到 `packages/bindings/public`

#### Scenario: WASM 构建成功
- **WHEN** 执行 cheap WebGL 的构建脚本
- **THEN** 构建成功并输出 `canvaskit_cheap.wasm` 到 `packages/bindings/public`

#### Scenario: WASM 接入单元测试
- **WHEN** 运行 WebGL 相关单元测试
- **THEN** 测试会触发 WASM 构建并验证输出文件存在

### Requirement: Skia 产物构建前置
系统 SHALL 在 `bindings` 的 `build` 流程中构建 Skia 产物，为 cheap WASM 构建测试提供依赖。

#### Scenario: build 生成 Skia 产物
- **WHEN** 执行 `pnpm build`（bindings 包）
- **THEN** Skia 构建产物（包含 `libskia.a`）可被 cheap WASM 构建脚本使用

### Requirement: wasm 调试构建选项
系统 SHALL 提供 wasm 调试构建选项（含分离 DWARF），以支持 Chrome WASM 调试流程。

#### Scenario: 启用调试构建
- **WHEN** 运行 wasm 构建并启用调试选项
- **THEN** 生成包含调试信息的 wasm（或分离 DWARF 文件）并可被调试器加载

### Requirement: Skia GPU context 与 Surface 绑定
系统 SHALL 为每个 WebGL 上下文创建并维护对应的 Skia GPU context 与 on-screen Surface。

#### Scenario: Surface 创建
- **GIVEN** 已创建的 WebGL 上下文
- **WHEN** 请求创建或更新 on-screen Surface
- **THEN** 返回与该上下文绑定的 Surface 实例

### Requirement: WebGLApi 导出
系统 SHALL 在 bindings 的公共入口导出 `WebGLApi`。

#### Scenario: API 可导入
- **WHEN** 调用方从 bindings 包导入 `WebGLApi`
- **THEN** 能够访问并使用多上下文管理能力
