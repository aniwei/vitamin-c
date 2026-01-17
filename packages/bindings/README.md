# bindings

## WebGL cheap WASM build

- Build Skia artifacts first (required for `libskia.a`):
  - `pnpm build`
- Build cheap WASM output (default output: `packages/bindings/public/canvaskit_cheap.wasm`):
  - `pnpm wasm:build`

### Debug build options (Chrome WASM debugging)

- `CHEAP_DEBUG=1` 生成带调试信息的 wasm
- `CHEAP_DEBUG=1 CHEAP_DEBUG_SEPARATE=1` 生成分离 DWARF 文件
- `CHEAP_DEBUG_FILE=canvaskit_cheap.debug.wasm` 自定义分离 DWARF 文件名

示例：
- `CHEAP_DEBUG=1 CHEAP_DEBUG_SEPARATE=1 pnpm wasm:build`

输出文件：
- `packages/bindings/public/canvaskit_cheap.wasm`
- `packages/bindings/public/canvaskit_cheap.debug.wasm`（当启用分离 DWARF）
