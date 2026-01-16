# Chrome DevTools 调试快速指南

## 🚀 快速开始

1. **安装 Chrome 扩展**
   ```
   https://goo.gle/wasm-debugging-extension
   ```

2. **启动开发服务器**
   ```bash
   cd packages/bindings-example
   pnpm dev
   ```

3. **打开 Chrome DevTools**
   - 访问 http://localhost:5174
   - 按 F12 打开 DevTools
   - 切换到 **Sources** 面板

4. **查找 C++ 源代码**
   ```
   Sources > wasm://...
   └── canvaskit_cheap_bindings.cpp  ← 在这里设置断点
   ```

## 🎯 推荐断点位置

### WebGL 上下文创建
```cpp
// 文件: packages/bindings/native/canvaskit_cheap_bindings.cpp
// 函数: WebGL_CreateContext

EMSCRIPTEN_KEEPALIVE
extern "C" int WebGL_CreateContext(...) {
  // 💡 在这一行设置断点
  EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx = ...
}
```

### Surface 创建
```cpp
// 函数: MakeOnScreenCanvasSurface

extern "C" void* MakeOnScreenCanvasSurface(...) {
  // 💡 设置断点查看 canvas 参数
  sk_sp<SkSurface> surface = ...
}
```

### 绘图操作
```cpp
// 函数: Canvas_drawPath, Canvas_clear 等

extern "C" void Canvas_drawPath(...) {
  // 💡 设置断点查看绘图参数
  SkCanvas* canvas = ...
}
```

## 🔧 调试技巧

### 查看变量
- 鼠标悬停在变量上查看值
- 在 Console 中输入变量名查看详细信息
- 点击 🔍 图标查看内存

### 调用堆栈
- 查看 C++ → JavaScript 的完整调用链
- 从 JavaScript 函数追踪到 C++ 实现

### 单步执行
- `F10` / `⌘'` - 单步跳过
- `F11` / `⌘;` - 单步进入
- `Shift+F11` / `⌘⇧;` - 单步跳出

## 📊 文件说明

当前使用的是**分离调试信息**版本：

- `canvaskit.wasm` (9.2 MB) - 主 wasm 文件，包含调试符号引用
- `canvaskit.debug.wasm` (12 MB) - DWARF 调试信息，仅在 DevTools 打开时加载

## ⚠️ 注意事项

1. **性能**：DevTools 打开时性能会降低（这是正常的）
2. **文件大小**：调试版本比生产版本大约 3-4 倍
3. **浏览器**：需要 Chrome 或 Edge（基于 Chromium）

## 🔄 切换回生产版本

```bash
cd packages/bindings/native
CHEAP_WEBGL=1 ./build_canvaskit_cheap.sh  # 不带 CHEAP_DEBUG
```

## 📖 完整文档

详见: [packages/third-party/skia/modules/canvaskit/DEBUG_GUIDE.md](../../third-party/skia/modules/canvaskit/DEBUG_GUIDE.md)
