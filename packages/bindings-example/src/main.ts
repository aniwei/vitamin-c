import { CanvasKitApi, PaintStyle, TileMode } from 'bindings'

// 枚举类型定义（等待 bindings 完整导出后可删除）
enum BlendMode { Clear = 0, Src, Dst, SrcOver, DstOver, SrcIn, DstIn, SrcOut, DstOut, SrcATop, DstATop, Xor, Plus, Modulate, Screen, Overlay, Darken, Lighten, ColorDodge, ColorBurn, HardLight, SoftLight, Difference, Exclusion, Multiply, Hue, Saturation, Color, Luminosity }
enum StrokeCap { Butt = 0, Round, Square }
enum StrokeJoin { Miter = 0, Round, Bevel }
enum BlurStyle { Normal = 0, Solid, Outer, Inner }

const wasmUri = new URLSearchParams(location.search).get('wasm') ?? '/canvaskit.js';
(document.getElementById('wasm-uri') as HTMLElement).textContent = wasmUri

const statusEl = document.getElementById('status') as HTMLPreElement
const swImg = document.getElementById('sw-preview') as HTMLImageElement
const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement
const webgpuCanvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement

function setStatus(msg: string) {
  statusEl.textContent = msg
}

function argb(a: number, r: number, g: number, b: number): number {
  return (((a & 255) << 24) | ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)) >>> 0
}

function allocUtf8(s: string): { ptr: number; byteLength: number } {
  const enc = new TextEncoder()
  const bytes = enc.encode(s)
  const buf = new Uint8Array(bytes.length + 1)
  buf.set(bytes, 0)
  buf[buf.length - 1] = 0
  const ptr = CanvasKitApi.alloc(buf)
  return { ptr, byteLength: bytes.length }
}

async function ensureReady() {
  try {
    await CanvasKitApi.ready({ uri: wasmUri })
  }
  catch (err) {
    if (wasmUri.endsWith('.js')) {
      setStatus(
        `加载 ${wasmUri} 失败，回退到 wasm-only。\n` +
          `错误：${String((err as any)?.message ?? err)}\n` +
          `注意：wasm-only 模式缺少 Emscripten WebGL/WebGPU glue，GPU 相关 API 可能不可用。`,
      )
      await CanvasKitApi.ready({ uri: '/cheap/canvaskit.wasm' })
      return
    }
    throw err
  }
}

function drawPathPaint(canvasPtr: number) {
  const paint = CanvasKitApi.Paint.make()
  const path = CanvasKitApi.Path.make()

  try {
    CanvasKitApi.Paint.setAntiAlias(paint, true)
    CanvasKitApi.Paint.setStyle(paint, PaintStyle.Fill)
    CanvasKitApi.Paint.setColor(paint, argb(255, 40, 150, 255))

    CanvasKitApi.Path.moveTo(path, 30, 200)
    CanvasKitApi.Path.cubicTo(path, 80, 30, 180, 30, 226, 200)
    CanvasKitApi.Path.lineTo(path, 30, 200)
    CanvasKitApi.Path.close(path)

    CanvasKitApi.Canvas.clear(canvasPtr, argb(255, 255, 255, 255))
    CanvasKitApi.Canvas.drawPath(canvasPtr, path, paint)
  } finally {
    CanvasKitApi.Path.delete(path)
    CanvasKitApi.Paint.delete(paint)
  }
}

// 更复杂的绘制示例，展示新 API
function drawAdvancedDemo(canvasPtr: number) {
  CanvasKitApi.Canvas.clear(canvasPtr, argb(255, 245, 245, 250))

  // 1. 绘制渐变背景圆
  const gradientPaint = CanvasKitApi.Paint.make()
  try {
    CanvasKitApi.Paint.setAntiAlias(gradientPaint, true)
    
    // 创建线性渐变
    const colors = new Uint32Array([
      argb(255, 100, 150, 255),
      argb(255, 255, 100, 150),
      argb(255, 150, 255, 100),
    ])
    const positions = new Float32Array([0, 0.5, 1])
    const colorsPtr = CanvasKitApi.malloc(colors.byteLength)
    const posPtr = CanvasKitApi.malloc(positions.byteLength)
    CanvasKitApi.setUint32Array(colorsPtr, colors)
    CanvasKitApi.setFloat32Array(posPtr, positions)
    
    const shader = CanvasKitApi.Shader.makeLinearGradient(0, 0, 256, 256, colorsPtr, posPtr, 3, TileMode.Clamp)
    CanvasKitApi.Paint.setShader(gradientPaint, shader)
    
    CanvasKitApi.Canvas.drawCircle(canvasPtr, 128, 128, 100, gradientPaint)
    
    CanvasKitApi.Shader.delete(shader)
    CanvasKitApi.free(colorsPtr)
    CanvasKitApi.free(posPtr)
  } finally {
    CanvasKitApi.Paint.delete(gradientPaint)
  }

  // 2. 绘制带描边的路径
  const strokePaint = CanvasKitApi.Paint.make()
  const path = CanvasKitApi.Path.make()
  try {
    CanvasKitApi.Paint.setAntiAlias(strokePaint, true)
    CanvasKitApi.Paint.setStyle(strokePaint, PaintStyle.Stroke)
    CanvasKitApi.Paint.setStrokeWidth(strokePaint, 4)
    CanvasKitApi.Paint.setStrokeCap(strokePaint, StrokeCap.Round)
    CanvasKitApi.Paint.setStrokeJoin(strokePaint, StrokeJoin.Round)
    CanvasKitApi.Paint.setColor(strokePaint, argb(255, 50, 50, 80))

    CanvasKitApi.Path.moveTo(path, 40, 40)
    CanvasKitApi.Path.cubicTo(path, 100, 20, 156, 80, 216, 40)
    CanvasKitApi.Path.cubicTo(path, 200, 100, 150, 150, 216, 216)
    CanvasKitApi.Path.cubicTo(path, 150, 200, 100, 180, 40, 216)
    CanvasKitApi.Path.cubicTo(path, 60, 150, 80, 100, 40, 40)
    CanvasKitApi.Path.close(path)

    CanvasKitApi.Canvas.drawPath(canvasPtr, path, strokePaint)
  } finally {
    CanvasKitApi.Path.delete(path)
    CanvasKitApi.Paint.delete(strokePaint)
  }

  // 3. 绘制带阴影效果的文本框
  const shadowPaint = CanvasKitApi.Paint.make()
  try {
    CanvasKitApi.Paint.setAntiAlias(shadowPaint, true)
    CanvasKitApi.Paint.setColor(shadowPaint, argb(180, 0, 0, 0))
    
    // 模拟阴影 - 偏移绘制
    CanvasKitApi.Canvas.drawRRect(canvasPtr, 83, 183, 183, 233, 8, 8, shadowPaint)
    
    // 绘制主矩形
    CanvasKitApi.Paint.setColor(shadowPaint, argb(255, 255, 255, 255))
    CanvasKitApi.Canvas.drawRRect(canvasPtr, 80, 180, 180, 230, 8, 8, shadowPaint)
  } finally {
    CanvasKitApi.Paint.delete(shadowPaint)
  }

  // 4. 绘制多个点
  const pointsPaint = CanvasKitApi.Paint.make()
  try {
    CanvasKitApi.Paint.setAntiAlias(pointsPaint, true)
    CanvasKitApi.Paint.setColor(pointsPaint, argb(255, 255, 80, 80))
    CanvasKitApi.Paint.setStrokeWidth(pointsPaint, 8)
    CanvasKitApi.Paint.setStrokeCap(pointsPaint, StrokeCap.Round)
    
    // 绘制装饰点
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 40
      const y = 50 + Math.sin(i * 0.8) * 15
      CanvasKitApi.Canvas.drawCircle(canvasPtr, x, y, 4, pointsPaint)
    }
  } finally {
    CanvasKitApi.Paint.delete(pointsPaint)
  }
}

async function runSw() {
  await ensureReady()
  setStatus('Running SW surface...')

  const w = 256
  const h = 256
  const surface = CanvasKitApi.Surface.makeSw(w, h)
  if (!surface) {
    setStatus('SW surface: MakeSWCanvasSurface returned 0')
    return
  }

  try {
    const canvasPtr = CanvasKitApi.Surface.getCanvas(surface)
    drawAdvancedDemo(canvasPtr)
    CanvasKitApi.Surface.flush(surface)

    const data = CanvasKitApi.Surface.encodeToPng(surface)
    if (!data) {
      setStatus('SW surface: Surface_encodeToPNG returned 0')
      return
    }

    const bytesPtr = (CanvasKitApi.invoke('Data_bytes', data) as number) >>> 0
    const size = (CanvasKitApi.invoke('Data_size', data) as number) | 0
    const bytes = size > 0 ? CanvasKitApi.getBytes(bytesPtr, size).slice() : new Uint8Array()
    CanvasKitApi.invoke('DeleteData', data)

    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
    const old = swImg.dataset.url
    if (old) URL.revokeObjectURL(old)
    swImg.dataset.url = url
    swImg.src = url

    setStatus('SW surface: OK (encoded PNG with advanced demo)')
  } finally {
    CanvasKitApi.Surface.delete(surface)
  }
}

async function runWebGL() {
  await ensureReady()
  setStatus('Running WebGL surface...')

  if (!CanvasKitApi.WebGL.hasWebGL()) {
    setStatus('WebGL: wasm missing WebGL exports (build with CHEAP_WEBGL)')
    return
  }

  const { ptr, byteLength } = allocUtf8('#webgl-canvas')
  let ctx = 0
  let surface = 0
  let auxPtr = 0
  let auxSurface = 0
  let auxCtx = 0
  try {
    ctx = CanvasKitApi.WebGL.createContext(ptr, byteLength, true)
    if (!ctx) {
      setStatus('WebGL: WebGL_CreateContext returned 0')
      return
    }

    const ok = CanvasKitApi.WebGL.makeContextCurrent(ctx)
    if (ok < 0) {
      setStatus(`WebGL: WebGL_MakeContextCurrent failed (code ${ok})`)
      return
    }

    // Multi-context smoke check
    const auxId = 'webgl-canvas-2'
    let auxCanvas = document.getElementById(auxId) as HTMLCanvasElement | null
    if (!auxCanvas) {
      auxCanvas = document.createElement('canvas')
      auxCanvas.id = auxId
      auxCanvas.width = webglCanvas.width
      auxCanvas.height = webglCanvas.height
      auxCanvas.style.display = 'none'
      webglCanvas.parentElement?.appendChild(auxCanvas)
    }

    const auxAlloc = allocUtf8(`#${auxId}`)
    auxPtr = auxAlloc.ptr
    auxCtx = CanvasKitApi.WebGL.createContext(auxPtr, auxAlloc.byteLength, true)
    if (!auxCtx) {
      setStatus('WebGL: WebGL_CreateContext (aux) returned 0')
      return
    }

    const auxOk = CanvasKitApi.WebGL.makeContextCurrent(auxCtx)
    if (auxOk < 0) {
      setStatus(`WebGL: WebGL_MakeContextCurrent (aux) failed (code ${auxOk})`)
      return
    }

    // Create an aux surface to validate context switching.
    auxSurface = CanvasKitApi.WebGL.makeOnScreenSurface(auxCanvas.width | 0, auxCanvas.height | 0)
    if (!auxSurface) {
      setStatus('WebGL: MakeOnScreenCanvasSurface (aux) returned 0')
      return
    }

    // Switch back to primary context for normal rendering.
    const backOk = CanvasKitApi.WebGL.makeContextCurrent(ctx)
    if (backOk < 0) {
      setStatus(`WebGL: WebGL_MakeContextCurrent (back) failed (code ${backOk})`)
      return
    }

    // 获取 WebGL 上下文信息
    const sampleCount = CanvasKitApi.WebGL.getSampleCount()
    const stencilBits = CanvasKitApi.WebGL.getStencilBits()

    // 创建 GrContext
    const grContext = CanvasKitApi.WebGL.makeGrContext()
    
    // Ensure canvas size matches surface
    const w = webglCanvas.width | 0
    const h = webglCanvas.height | 0
    
    // 使用扩展方法创建 surface，传入采样和模板参数
    surface = CanvasKitApi.WebGL.makeOnScreenSurfaceEx(w, h, sampleCount, stencilBits)
    if (!surface) {
      // 回退到基本方法
      surface = CanvasKitApi.WebGL.makeOnScreenSurface(w, h)
    }
    
    if (!surface) {
      setStatus('WebGL: MakeOnScreenCanvasSurface returned 0')
      return
    }

    const canvasPtr = CanvasKitApi.Surface.getCanvas(surface)
    drawAdvancedDemo(canvasPtr)
    CanvasKitApi.Surface.flush(surface)

    // 使用 GrContext flush 确保 GPU 操作完成
    if (grContext) {
      CanvasKitApi.GrContext.flushAndSubmit(grContext, false)
    }

    setStatus(`WebGL surface: OK\n` +
      `  Sample Count: ${sampleCount}\n` +
      `  Stencil Bits: ${stencilBits}\n` +
      `  GrContext: ${grContext ? 'created' : 'null'}`)
  } finally {
    CanvasKitApi.free(ptr)
    if (auxPtr) CanvasKitApi.free(auxPtr)
    if (auxSurface) CanvasKitApi.Surface.delete(auxSurface)
    if (auxCtx) CanvasKitApi.WebGL.destroyContext(auxCtx)
    if (surface) CanvasKitApi.Surface.delete(surface)
    if (ctx) CanvasKitApi.WebGL.destroyContext(ctx)
  }
}

async function checkWebGPU() {
  await ensureReady()

  const hasNavigatorGpu = typeof (navigator as any).gpu !== 'undefined'
  const hasWasmExport = CanvasKitApi.WebGPU.hasWebGPU()

  const lines = [
    `navigator.gpu: ${hasNavigatorGpu}`,
    `wasm export MakeGPUTextureSurface: ${hasWasmExport}`,
  ]

  if (!hasNavigatorGpu) {
    lines.push('WebGPU not available in this browser.')
    setStatus(lines.join('\n'))
    return
  }

  if (!hasWasmExport) {
    lines.push('Rebuild cheap wasm with CHEAP_WEBGPU to enable MakeGPUTextureSurface.')
    setStatus(lines.join('\n'))
    return
  }

  // 尝试初始化 WebGPU
  try {
    const gpu = (navigator as any).gpu
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      lines.push('WebGPU: requestAdapter() returned null')
      setStatus(lines.join('\n'))
      return
    }

    const device = await adapter.requestDevice()
    if (!device) {
      lines.push('WebGPU: requestDevice() returned null')
      setStatus(lines.join('\n'))
      return
    }

    // 配置 canvas
    const context = webgpuCanvas.getContext('webgpu') as any
    if (!context) {
      lines.push('WebGPU: getContext("webgpu") returned null')
      setStatus(lines.join('\n'))
      return
    }

    const format = gpu.getPreferredCanvasFormat()
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    })

    lines.push(`WebGPU adapter: ${adapter.info?.vendor ?? 'unknown'}`)
    lines.push(`Preferred format: ${format}`)
    lines.push('')
    lines.push('WebGPU context configured successfully!')
    lines.push('Note: Full Skia WebGPU integration requires Dawn backend.')
    lines.push('The WASM module has WebGPU exports, but Emscripten WebGPU glue')
    lines.push('(JsValStore) is needed for texture handle interop.')
    
    // 清理
    context.unconfigure()
    device.destroy()
  } catch (err) {
    lines.push(`WebGPU error: ${String((err as any)?.message ?? err)}`)
  }

  setStatus(lines.join('\n'))
}

// 新增: RenderTarget 演示
async function runRenderTarget() {
  await ensureReady()
  setStatus('Running RenderTarget surface...')

  if (!CanvasKitApi.WebGL.hasWebGL()) {
    setStatus('RenderTarget: wasm missing WebGL exports (build with CHEAP_WEBGL)')
    return
  }

  const { ptr, byteLength } = allocUtf8('#webgl-canvas')
  let ctx = 0
  let surface = 0
  try {
    ctx = CanvasKitApi.WebGL.createContext(ptr, byteLength, true)
    if (!ctx) {
      setStatus('RenderTarget: WebGL_CreateContext returned 0')
      return
    }

    const ok = CanvasKitApi.WebGL.makeContextCurrent(ctx)
    if (ok < 0) {
      setStatus(`RenderTarget: WebGL_MakeContextCurrent failed (code ${ok})`)
      return
    }

    // 创建 GrContext
    const grContext = CanvasKitApi.WebGL.makeGrContext()
    if (!grContext) {
      setStatus('RenderTarget: MakeGrContextWebGL returned 0')
      return
    }

    const w = webglCanvas.width | 0
    const h = webglCanvas.height | 0
    
    // 使用 MakeRenderTarget 创建离屏 GPU surface
    surface = CanvasKitApi.invoke('MakeRenderTarget', w, h) as number
    if (!surface) {
      setStatus('RenderTarget: MakeRenderTarget returned 0 (may not be exported)')
      return
    }

    const canvasPtr = CanvasKitApi.Surface.getCanvas(surface)
    drawAdvancedDemo(canvasPtr)
    
    // flush and submit
    CanvasKitApi.Surface.flush(surface)
    CanvasKitApi.GrContext.flushAndSubmit(grContext, true) // sync

    // 获取快照并显示
    const imagePtr = CanvasKitApi.Surface.makeImageSnapshot(surface)
    if (imagePtr) {
      const imgW = CanvasKitApi.Image.width(imagePtr)
      const imgH = CanvasKitApi.Image.height(imagePtr)
      setStatus(`RenderTarget: OK\n  Image size: ${imgW}x${imgH}\n  GrContext created and flushed`)
      CanvasKitApi.Image.delete(imagePtr)
    } else {
      setStatus('RenderTarget: makeImageSnapshot returned 0')
    }
  } finally {
    CanvasKitApi.free(ptr)
    if (surface) CanvasKitApi.Surface.delete(surface)
    if (ctx) CanvasKitApi.WebGL.destroyContext(ctx)
  }
}

document.getElementById('run-sw')!.addEventListener('click', () => {
  runSw().catch((e) => setStatus(String(e?.stack || e)))
})

document.getElementById('run-webgl')!.addEventListener('click', () => {
  runWebGL().catch((e) => setStatus(String(e?.stack || e)))
})

document.getElementById('run-webgpu')!.addEventListener('click', () => {
  checkWebGPU().catch((e) => setStatus(String(e?.stack || e)))
})

document.getElementById('run-rendertarget')!.addEventListener('click', () => {
  runRenderTarget().catch((e) => setStatus(String(e?.stack || e)))
})
