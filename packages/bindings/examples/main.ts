import {
  CanvasKitApi,
  WebGLApi,
  Paint,
  Path,
  ParagraphBuilder,
  ColorFilter,
  ImageFilter,
  MaskFilter,
  Shader,
  BlendMode,
  TileMode,
  TextAlign,
  BlurStyle,
} from '../src/index'
import { loadCanvasKit } from './wasm'
import fontUrl from '../../third-party/skia/modules/canvaskit/fonts/NotoMono-Regular.ttf?url'

const statusEl = document.getElementById('status') as HTMLDivElement | null
const logEl = document.getElementById('log') as HTMLPreElement | null

function log(message: string) {
  if (logEl) {
    logEl.textContent += `${message}\n`
  }
  console.log(message)
}

function setStatus(message: string) {
  if (statusEl) statusEl.textContent = message
}

async function init() {
  setStatus('Loading wasm…')
  await loadCanvasKit()
  const fontBytes = await loadFontBytes(fontUrl)
  setStatus('Ready')

  renderSurfaceExample()
  renderWebGLExample()
  renderParagraphExample(fontBytes)
  runFilterExample()
  runWebGPUExample()
}

async function loadFontBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load font: ${res.status} ${res.statusText}`)
  }
  const buffer = await res.arrayBuffer()
  return new Uint8Array(buffer)
}

function renderSurfaceExample() {
  const canvas = document.getElementById('sw-canvas') as HTMLCanvasElement | null
  if (!canvas) return

  const width = canvas.width
  const height = canvas.height

  const surface = CanvasKitApi.Surface.makeSw(width, height)
  const skCanvas = CanvasKitApi.Surface.getCanvas(surface)

  const paint = new Paint()
  paint.setAntiAlias(true)
  paint.setColor(0xff4caf50)

  const path = Path.make()
  path.addRect(20, 20, width - 20, height - 20)
  path.addCircle(width / 2, height / 2, 40)

  CanvasKitApi.Canvas.clear(skCanvas, 0xff111826)
  CanvasKitApi.Canvas.drawPath(skCanvas, path.raw, paint.raw)

  const shader = Shader.makeLinearGradient(0, 0, width, height, [0xff42a5f5, 0xffab47bc], [0, 1], TileMode.Clamp)
  paint.setShader(shader.raw)
  CanvasKitApi.Canvas.drawRect(skCanvas, 40, 40, width - 40, height - 40, paint.raw)

  CanvasKitApi.Surface.flush(surface)

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const byteLen = width * height * 4
  const dst = CanvasKitApi.malloc(byteLen)
  CanvasKitApi.Surface.readPixelsRgba8888(surface, 0, 0, width, height, dst, width * 4)
  const bytes = CanvasKitApi.getBytes(dst, byteLen)
  const imageData = new ImageData(new Uint8ClampedArray(bytes), width, height)
  ctx.putImageData(imageData, 0, 0)
  CanvasKitApi.free(dst)

  shader.delete()
  path.delete()
  paint.delete()
  surface.delete()

  log('Surface + Canvas example rendered')
}

function renderWebGLExample() {
  const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement | null
  if (!canvas) return

  const api = new WebGLApi()
  if (!api.hasWebGL()) {
    log('WebGL exports unavailable in this build')
    return
  }

  const id = api.createContext({ selector: '#webgl-canvas', width: canvas.width, height: canvas.height })
  const ctx = api.getContext(id)
  if (!ctx) {
    log('WebGL context creation failed')
    return
  }

  const paint = new Paint()
  paint.setAntiAlias(true)
  paint.setColor(0xffef5350)

  CanvasKitApi.Canvas.clear(CanvasKitApi.Surface.getCanvas(ctx.surface), 0xff0b1020)
  CanvasKitApi.Canvas.drawCircle(CanvasKitApi.Surface.getCanvas(ctx.surface), 160, 100, 60, paint.raw)
  CanvasKitApi.Surface.flush(ctx.surface)

  paint.delete()
  api.destroyContext(id)

  log('WebGL example rendered')
}

function renderParagraphExample(fontBytes: Uint8Array) {
  const canvas = document.getElementById('paragraph-canvas') as HTMLCanvasElement | null
  if (!canvas) return

  const surface = CanvasKitApi.Surface.makeSw(canvas.width, canvas.height)
  const skCanvas = CanvasKitApi.Surface.getCanvas(surface)

  const builder = ParagraphBuilder.create({
    fontBytes,
    fontSize: 20,
    color: 0xffffffff,
    textAlign: TextAlign.Start,
  })
  builder.addText('Hello CanvasKit Paragraph')
  const paragraph = builder.build(280)
  paragraph.layout(280)

  CanvasKitApi.Canvas.clear(skCanvas, 0xff1c2230)
  CanvasKitApi.Canvas.drawParagraph(skCanvas, paragraph.raw, 20, 40)

  CanvasKitApi.Surface.flush(surface)

  const ctx = canvas.getContext('2d')
  if (ctx) {
    const byteLen = canvas.width * canvas.height * 4
    const dst = CanvasKitApi.malloc(byteLen)
    CanvasKitApi.Surface.readPixelsRgba8888(surface, 0, 0, canvas.width, canvas.height, dst, canvas.width * 4)
    const bytes = CanvasKitApi.getBytes(dst, byteLen)
    ctx.putImageData(new ImageData(new Uint8ClampedArray(bytes), canvas.width, canvas.height), 0, 0)
    CanvasKitApi.free(dst)
  }

  paragraph.dispose()
  builder.dispose()
  surface.delete()

  log('Paragraph example rendered')
}

function runFilterExample() {
  const paint = new Paint()
  const mask = MaskFilter.makeBlur(BlurStyle.Normal, 8)
  const color = ColorFilter.makeBlend(0xff00bcd4, BlendMode.SrcOver)
  const imageFilter = ImageFilter.makeBlur(2, 2, TileMode.Clamp)

  paint.setMaskFilter(mask.raw)
  paint.setColorFilter(color.raw)
  paint.setImageFilter(imageFilter.raw)

  mask.delete()
  color.delete()
  imageFilter.delete()
  paint.delete()

  log('Filter objects created')
}

function runWebGPUExample() {
  const hasWebGPU = CanvasKitApi.WebGPU.hasWebGPU()
  log(`WebGPU available: ${hasWebGPU}`)
}

init().catch((err) => {
  console.error(err)
  setStatus('Failed')
  log(`Init failed: ${String(err)}`)
})
