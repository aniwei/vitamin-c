import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import * as path from 'node:path'

import { CanvasKitApi } from '../../CanvasKitApi'

const bindingsRoot = path.resolve(__dirname, '..', '..', '..')
const wasmPath = path.resolve(bindingsRoot, 'native/canvaskit_cheap.wasm')

async function ensureWasm(): Promise<void> {
  if (existsSync(wasmPath)) return

  const result = spawnSync('pnpm', ['wasm:build'], {
    cwd: bindingsRoot,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`pnpm wasm:build failed with status ${result.status}`)
  }
}

describe('cheap wasm api coverage', () => {
  let api: Awaited<ReturnType<typeof CanvasKitApi.ready>>

  beforeAll(async () => {
    await ensureWasm()
    api = await CanvasKitApi.ready({ path: wasmPath })
  }, 600_000)

  it('exports required api symbols', () => {
    const required = [
      'Data_bytes',
      'Data_size',
      'DeleteData',
      'MakeCanvasSurface',
      'MakeSWCanvasSurface',
      'MakeOnScreenCanvasSurface',
      'MakeOnScreenCanvasSurfaceEx',
      'MakeRenderTarget',
      'MakeRenderTargetSurface',
      'MakeGrContextWebGL',
      'WebGL_CreateContext',
      'WebGL_MakeContextCurrent',
      'WebGL_DestroyContext',
      'WebGL_GetSampleCount',
      'WebGL_GetStencilBits',
      'WebGL_GetLastError',
      'DeleteSurface',
      'Surface_getCanvas',
      'Surface_makeImageSnapshot',
      'Surface_flush',
      'Surface_width',
      'Surface_height',
      'Surface_encodeToPNG',
      'Surface_readPixelsRGBA8888',
      'Surface_makeImageFromTexture',
      'MakePaint',
      'DeletePaint',
      'Paint_copy',
      'Paint_setColor',
      'Paint_setColor4f',
      'Paint_getColor',
      'Paint_setAntiAlias',
      'Paint_isAntiAlias',
      'Paint_setDither',
      'Paint_isDither',
      'Paint_setStyle',
      'Paint_getStyle',
      'Paint_setStrokeWidth',
      'Paint_getStrokeWidth',
      'Paint_setStrokeCap',
      'Paint_getStrokeCap',
      'Paint_setStrokeJoin',
      'Paint_getStrokeJoin',
      'Paint_setStrokeMiter',
      'Paint_getStrokeMiter',
      'Paint_setAlphaf',
      'Paint_getAlphaf',
      'Paint_setBlendMode',
      'Paint_getBlendMode',
      'Paint_setShader',
      'Paint_setColorFilter',
      'Paint_setMaskFilter',
      'Paint_setPathEffect',
      'Paint_setImageFilter',
      'MakePath',
      'DeletePath',
      'Path_setFillType',
      'Path_moveTo',
      'Path_lineTo',
      'Path_close',
      'Path_reset',
      'Path_getBounds',
      'Path_quadTo',
      'Path_cubicTo',
      'Path_addRect',
      'Path_addCircle',
      'Path_addOval',
      'Path_addRRectXY',
      'Path_addPolygon',
      'Path_addArc',
      'Path_arcToOval',
      'Path_snapshot',
      'DeleteSkPath',
      'Path_transform',
      'SkPath_getBounds',
      'Canvas_clear',
      'Canvas_getSaveCount',
      'Canvas_saveLayer',
      'Canvas_save',
      'Canvas_restore',
      'Canvas_restoreToCount',
      'Canvas_translate',
      'Canvas_scale',
      'Canvas_rotate',
      'Canvas_drawOval',
      'Canvas_drawArc',
      'Canvas_drawPaint',
      'Canvas_concat',
      'Canvas_setMatrix',
      'Canvas_clipRect',
      'Canvas_drawRect',
      'Canvas_drawPath',
      'Canvas_drawSkPath',
      'Canvas_drawCircle',
      'Canvas_drawLine',
      'Canvas_drawImage',
      'Canvas_drawImageWithPaint',
      'Canvas_drawImageRect',
      'Canvas_drawImageRectWithPaint',
      'Canvas_drawTextBlob',
      'Canvas_drawParagraph',
      'Canvas_clipPath',
      'Canvas_clipRRect',
      'Canvas_drawRRect',
      'Canvas_drawDRRect',
      'Canvas_drawPoints',
      'Canvas_drawVertices',
      'Canvas_skew',
      'Canvas_resetMatrix',
      'Canvas_getLocalToDevice',
      'Canvas_getTotalMatrix',
      'Canvas_getDeviceClipBounds',
      'Canvas_getLocalClipBounds',
      'Canvas_quickRejectRect',
      'Canvas_quickRejectPath',
      'MakeImageFromEncoded',
      'MakeImageFromRGBA8888',
      'DeleteImage',
      'Image_width',
      'Image_height',
      'Image_alphaType',
      'Image_colorType',
      'Image_makeShader',
      'Image_readPixelsRGBA8888',
      'Image_encodeToPNG',
      'DeleteShader',
      'MakeColorShader',
      'MakeLinearGradientShader',
      'MakeRadialGradientShader',
      'MakeSweepGradientShader',
      'MakeTwoPointConicalGradientShader',
      'MakeImageShader',
      'DeleteColorFilter',
      'MakeBlendColorFilter',
      'MakeMatrixColorFilter',
      'MakeComposeColorFilter',
      'MakeLerpColorFilter',
      'MakeSRGBToLinearGammaColorFilter',
      'MakeLinearToSRGBGammaColorFilter',
      'DeleteMaskFilter',
      'MakeBlurMaskFilter',
      'DeleteImageFilter',
      'MakeBlurImageFilter',
      'MakeColorFilterImageFilter',
      'MakeComposeImageFilter',
      'MakeDropShadowImageFilter',
      'MakeDropShadowOnlyImageFilter',
      'DeletePathEffect',
      'MakeDashPathEffect',
      'MakeDiscretePathEffect',
      'MakeCornerPathEffect',
      'MakeComposePathEffect',
      'MakeSumPathEffect',
      'MakeParagraphFromText',
      'MakeParagraphFromTextWithEllipsis',
      'Paragraph_layout',
      'Paragraph_getHeight',
      'Paragraph_getMaxWidth',
      'Paragraph_getMinIntrinsicWidth',
      'Paragraph_getMaxIntrinsicWidth',
      'Paragraph_getLongestLine',
      'DeleteParagraph',
      'MakeParagraphBuilder',
      'MakeParagraphBuilderWithEllipsis',
      'ParagraphBuilder_pushStyle',
      'ParagraphBuilder_pop',
      'ParagraphBuilder_addText',
      'ParagraphBuilder_build',
      'DeleteParagraphBuilder',
      'GetCurrentGrContext',
      'GrContext_flush',
      'GrContext_submit',
      'GrContext_flushAndSubmit',
      'GrContext_getResourceCacheLimitBytes',
      'GrContext_getResourceCacheUsageBytes',
      'GrContext_setResourceCacheLimitBytes',
      'GrContext_releaseResourcesAndAbandonContext',
      'GrContext_freeGpuResources',
      'GrContext_performDeferredCleanup',
      'MakeGPUTextureSurface',
      'Surface_replaceBackendTexture',
      'MakeGrContext',
    ]

    const missing = required.filter((name) => !api.hasExport(name))
    expect(missing, `Missing wasm exports: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('creates basic objects on cheap wasm', () => {
    const surface = api.Surface.makeSw(16, 16)
    expect(surface).toBeTruthy()

    const canvas = api.Surface.getCanvas(surface)
    expect(canvas).toBeTruthy()

    const paint = api.Paint.make()
    api.Paint.setAntiAlias(paint, true)
    api.Paint.setColor(paint, 0xffff0000)

    const path = api.Path.make()
    api.Path.moveTo(path, 0, 0)
    api.Path.lineTo(path, 12, 12)
    api.Path.close(path)

    api.Canvas.drawPath(canvas, path, paint)
    api.Canvas.drawCircle(canvas, 8, 8, 4, paint)

    const image = api.Surface.makeImageSnapshot(surface)
    expect(image).toBeTruthy()
    expect(api.Image.width(image)).toBe(16)

    const data = api.Surface.encodeToPng(surface)
    expect(data).toBeTruthy()
    api.invoke('Data_size', data)
    api.invoke('DeleteData', data)

    api.Image.delete(image)
    api.Path.delete(path)
    api.Paint.delete(paint)
    api.Surface.delete(surface)
  })

  it('invokes all api methods', () => {
    const surface = api.Surface.makeCanvas(8, 8)
    const swSurface = api.Surface.makeSw(4, 4)
    const canvas = api.Surface.getCanvas(surface)

    const paint = api.Paint.make()
    const paintCopy = api.Paint.copy(paint)
    api.Paint.setColor(paint, 0xff00ff00)
    api.Paint.setColor4f(paint, 1, 0, 0, 1)
    api.Paint.setAntiAlias(paint, true)
    api.Paint.isAntiAlias(paint)
    api.Paint.setDither(paint, false)
    api.Paint.isDither(paint)
    api.Paint.setStyle(paint, 0)
    api.Paint.getStyle(paint)
    api.Paint.setStrokeWidth(paint, 2)
    api.Paint.getStrokeWidth(paint)
    api.Paint.setStrokeCap(paint, 0)
    api.Paint.getStrokeCap(paint)
    api.Paint.setStrokeJoin(paint, 0)
    api.Paint.getStrokeJoin(paint)
    api.Paint.setStrokeMiter(paint, 4)
    api.Paint.getStrokeMiter(paint)
    api.Paint.setAlphaf(paint, 0.5)
    api.Paint.getAlphaf(paint)
    api.Paint.setBlendMode(paint, 3)
    api.Paint.getBlendMode(paint)

    const path = api.Path.make()
    api.Path.setFillType(path, 0)
    api.Path.moveTo(path, 0, 0)
    api.Path.lineTo(path, 4, 4)
    api.Path.quadTo(path, 4, 0, 8, 4)
    api.Path.cubicTo(path, 0, 8, 4, 8, 8, 0)
    api.Path.addRect(path, 0, 0, 4, 4)
    api.Path.addCircle(path, 2, 2, 1)
    api.Path.addOval(path, 0, 0, 4, 4, 0, 0)
    api.Path.addRRectXY(path, 0, 0, 6, 6, 1, 1, 0, 0)

    const pointsPtr = api.malloc(4 * 4)
    api.setFloat32Array(pointsPtr, [0, 0, 4, 4])
    api.Path.addPolygon(path, pointsPtr, 2, true)
    api.Path.addArc(path, 0, 0, 6, 6, 0, 180)
    api.Path.arcToOval(path, 0, 0, 6, 6, 0, 180, false)

    const m9Ptr = api.malloc(9 * 4)
    api.setFloat32Array(m9Ptr, [1, 0, 0, 0, 1, 0, 0, 0, 1])
    const boundsPtr = api.malloc(4 * 4)
    api.Path.getBounds(path, boundsPtr)

    const skPath = api.Path.snapshot(path)
    api.Path.transform(skPath, m9Ptr)
    api.Path.getSkPathBounds(skPath, boundsPtr)

    api.Canvas.clear(canvas, 0)
    api.Canvas.getSaveCount(canvas)
    api.Canvas.saveLayer(canvas, 0, 0, 8, 8, true, paint)
    api.Canvas.save(canvas)
    api.Canvas.restore(canvas)
    api.Canvas.restoreToCount(canvas, 1)
    api.Canvas.translate(canvas, 1, 1)
    api.Canvas.scale(canvas, 1, 1)
    api.Canvas.rotate(canvas, 0)
    api.Canvas.drawOval(canvas, 0, 0, 4, 4, paint)
    api.Canvas.drawArc(canvas, 0, 0, 6, 6, 0, 180, false, paint)
    api.Canvas.drawPaint(canvas, paint)
    api.Canvas.concat(canvas, m9Ptr)
    api.Canvas.setMatrix(canvas, m9Ptr)
    api.Canvas.clipRect(canvas, 0, 0, 8, 8, 1, true)
    api.Canvas.drawRect(canvas, 0, 0, 4, 4, paint)
    api.Canvas.drawPath(canvas, path, paint)
    api.Canvas.drawSkPath(canvas, skPath, paint)
    api.Canvas.drawCircle(canvas, 4, 4, 2, paint)
    api.Canvas.drawLine(canvas, 0, 0, 4, 4, paint)

    const pixelBytes = new Uint8Array(16).fill(255)
    const pixelPtr = api.allocBytes(pixelBytes)
    const image = api.Image.makeFromRGBA8888(pixelPtr, 2, 2)
    api.free(pixelPtr)

    api.Canvas.drawImage(canvas, image, 0, 0, 0, 0)
    api.Canvas.drawImageWithPaint(canvas, image, 0, 0, 0, 0, paint)
    api.Canvas.drawImageRect(canvas, image, 0, 0, 2, 2, 0, 0, 4, 4, 0, 0)
    api.Canvas.drawImageRectWithPaint(canvas, image, 0, 0, 2, 2, 0, 0, 4, 4, 0, 0, paint)
    api.Canvas.drawTextBlob(canvas, 0, 0, 0, paint)

    const outMatrixPtr = api.malloc(9 * 4)
    api.Canvas.getLocalToDevice(canvas, outMatrixPtr)
    api.Canvas.getTotalMatrix(canvas, outMatrixPtr)

    const outRectPtr = api.malloc(4 * 4)
    api.Canvas.getDeviceClipBounds(canvas, outRectPtr)
    api.Canvas.getLocalClipBounds(canvas, outRectPtr)
    api.Canvas.quickRejectRect(canvas, 0, 0, 1, 1)
    api.Canvas.quickRejectPath(canvas, path)

    api.Canvas.clipPath(canvas, path, 1, true)
    api.Canvas.clipRRect(canvas, 0, 0, 6, 6, 1, 1, 1, true)
    api.Canvas.drawRRect(canvas, 0, 0, 6, 6, 1, 1, paint)
    api.Canvas.drawDRRect(canvas, 0, 0, 6, 6, 1, 1, 1, 1, 5, 5, 1, 1, paint)
    api.Canvas.drawPoints(canvas, 0, pointsPtr, 2, paint)

    const vertsPtr = api.malloc(3 * 2 * 4)
    api.setFloat32Array(vertsPtr, [0, 0, 1, 0, 0, 1])
    const texPtr = api.malloc(3 * 2 * 4)
    api.setFloat32Array(texPtr, [0, 0, 1, 0, 0, 1])
    const vColorsPtr = api.malloc(3 * 4)
    api.setUint32Array(vColorsPtr, [0xffffffff, 0xffffffff, 0xffffffff])
    api.Canvas.drawVertices(canvas, 0, vertsPtr, texPtr, vColorsPtr, 3, 0, 0, 3, paint)

    api.Canvas.skew(canvas, 0, 0)
    api.Canvas.resetMatrix(canvas)

    api.Surface.flush(surface)
    api.Surface.width(surface)
    api.Surface.height(surface)

    const dstPtr = api.malloc(2 * 2 * 4)
    api.Surface.readPixelsRgba8888(surface, 0, 0, 2, 2, dstPtr, 2 * 4)

    const snapshot = api.Surface.makeImageSnapshot(surface)
    const dataPtr = api.Surface.encodeToPng(surface)
    const dataBytesPtr = api.invoke('Data_bytes', dataPtr) as number
    const dataSize = api.invoke('Data_size', dataPtr) as number
    const encodedImage = api.Image.makeFromEncoded(dataBytesPtr, dataSize)
    api.invoke('DeleteData', dataPtr)

    api.Image.width(image)
    api.Image.height(image)
    api.Image.alphaType(image)
    api.Image.colorType(image)
    api.Image.readPixelsRgba8888(image, 0, 0, 2, 2, dstPtr, 2 * 4)
    const encodedImageData = api.Image.encodeToPng(image)
    api.invoke('DeleteData', encodedImageData)
    const imageShader2 = api.Image.makeShader(image, 0, 0, 0, 0, m9Ptr)

    const shader = api.Shader.makeColor(0xff00ff00)
    const colorsPtr = api.malloc(2 * 4)
    api.setUint32Array(colorsPtr, [0xff000000, 0xffffffff])
    const positionsPtr = api.malloc(2 * 4)
    api.setFloat32Array(positionsPtr, [0, 1])
    const linear = api.Shader.makeLinearGradient(0, 0, 1, 1, colorsPtr, positionsPtr, 2, 0)
    const radial = api.Shader.makeRadialGradient(0, 0, 1, colorsPtr, positionsPtr, 2, 0)
    const sweep = api.Shader.makeSweepGradient(0, 0, colorsPtr, positionsPtr, 2, 0, 0, 360)
    const conical = api.Shader.makeTwoPointConicalGradient(0, 0, 1, 1, 1, 2, colorsPtr, positionsPtr, 2, 0)
    const imageShader = api.Shader.makeImage(image, 0, 0, 0, 0, m9Ptr)
    api.Paint.setShader(paint, shader)

    const matrixPtr = api.malloc(20 * 4)
    api.setFloat32Array(matrixPtr, [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ])
    const blendFilter = api.ColorFilter.makeBlend(0xffffffff, 3)
    const matrixFilter = api.ColorFilter.makeMatrix(matrixPtr)
    const composeFilter = api.ColorFilter.makeCompose(blendFilter, matrixFilter)
    const lerpFilter = api.ColorFilter.makeLerp(0.5, blendFilter, matrixFilter)
    const toLinear = api.ColorFilter.makeSRGBToLinearGamma()
    const toSRGB = api.ColorFilter.makeLinearToSRGBGamma()
    api.Paint.setColorFilter(paint, blendFilter)

    const maskFilter = api.MaskFilter.makeBlur(0, 2)
    api.Paint.setMaskFilter(paint, maskFilter)

    const intervalsPtr = api.malloc(2 * 4)
    api.setFloat32Array(intervalsPtr, [2, 2])
    const dash = api.PathEffect.makeDash(intervalsPtr, 2, 0)
    const discrete = api.PathEffect.makeDiscrete(1, 1, 0)
    const corner = api.PathEffect.makeCorner(1)
    const compose = api.PathEffect.makeCompose(dash, discrete)
    const sum = api.PathEffect.makeSum(dash, corner)
    api.Paint.setPathEffect(paint, dash)

    const blurFilter = api.ImageFilter.makeBlur(1, 1, 0, 0)
    const colorFilter = api.ImageFilter.makeColorFilter(blendFilter, blurFilter)
    const composeFilter2 = api.ImageFilter.makeCompose(blurFilter, colorFilter)
    const dropShadow = api.ImageFilter.makeDropShadow(1, 1, 1, 1, 0xff000000, blurFilter)
    const dropShadowOnly = api.ImageFilter.makeDropShadowOnly(1, 1, 1, 1, 0xff000000, blurFilter)
    api.Paint.setImageFilter(paint, blurFilter)

    const textBytes = new Uint8Array(Buffer.from('hi'))
    const textPtr = api.allocBytes(textBytes)
    const ellipsisBytes = new Uint8Array(Buffer.from('...'))
    const ellipsisPtr = api.allocBytes(ellipsisBytes)

    const paragraph = api.Paragraph.makeFromText(textPtr, textBytes.length, 0, 0, 12, 100, 0xff000000, 0, 0)
    const paragraphEllipsis = api.Paragraph.makeFromTextWithEllipsis(
      textPtr,
      textBytes.length,
      0,
      0,
      12,
      100,
      0xff000000,
      0,
      0,
      ellipsisPtr,
      ellipsisBytes.length
    )

    api.Paragraph.layout(paragraph, 100)
    api.Paragraph.getHeight(paragraph)
    api.Paragraph.getMaxWidth(paragraph)
    api.Paragraph.getMinIntrinsicWidth(paragraph)
    api.Paragraph.getMaxIntrinsicWidth(paragraph)
    api.Paragraph.getLongestLine(paragraph)

    const builder = api.ParagraphBuilder.make(0, 0, 12, 0xff000000, 0, 0)
    api.ParagraphBuilder.pushStyle(builder, 12, 0xff000000)
    api.ParagraphBuilder.addText(builder, textPtr, textBytes.length)
    api.ParagraphBuilder.pop(builder)
    const builtParagraph = api.ParagraphBuilder.build(builder, 100)

    api.Canvas.drawParagraph(canvas, paragraph, 0, 0)

    const surfaceInfoPtr = api.malloc(4 * 4)
    api.setUint32Array(surfaceInfoPtr, [1, 1, 4, 2])
    api.Surface.makeImageFromTexture(surface, 0, 1, surfaceInfoPtr)

    api.WebGL.createContext(0, 0, false)
    api.WebGL.makeContextCurrent(0)
    api.WebGL.destroyContext(0)
    api.WebGL.makeOnScreenSurface(1, 1)
    api.WebGL.makeOnScreenSurfaceEx(1, 1, 0, 0)
    api.WebGL.makeGrContext()
    api.WebGL.getSampleCount()
    api.WebGL.getStencilBits()
    api.WebGL.getLastError()
    api.WebGL.makeRenderTarget(1, 1)
    api.WebGL.makeRenderTargetSurface(1, 1)

    api.GrContext.getCurrent()
    api.GrContext.flush(0)
    api.GrContext.submit(0, false)
    api.GrContext.flushAndSubmit(0, false)
    api.GrContext.getResourceCacheLimitBytes(0)
    api.GrContext.getResourceCacheUsageBytes(0)
    api.GrContext.setResourceCacheLimitBytes(0, 0)
    api.GrContext.releaseResourcesAndAbandonContext(0)
    api.GrContext.freeGpuResources(0)
    api.GrContext.performDeferredCleanup(0, 0)

    api.WebGPU.hasWebGPU()
    api.WebGPU.makeGPUTextureSurface(0, 0, 1, 1)
    api.WebGPU.replaceBackendTexture(surface, 0, 0, 1, 1)
    api.WebGPU.makeGrContext()

    api.Paragraph.delete(paragraphEllipsis)
    api.Paragraph.delete(paragraph)
    api.Paragraph.delete(builtParagraph)
    api.ParagraphBuilder.delete(builder)

    api.ColorFilter.delete(blendFilter)
    api.ColorFilter.delete(matrixFilter)
    api.ColorFilter.delete(composeFilter)
    api.ColorFilter.delete(lerpFilter)
    api.ColorFilter.delete(toLinear)
    api.ColorFilter.delete(toSRGB)
    api.MaskFilter.delete(maskFilter)
    api.PathEffect.delete(dash)
    api.PathEffect.delete(discrete)
    api.PathEffect.delete(corner)
    api.PathEffect.delete(compose)
    api.PathEffect.delete(sum)
    api.ImageFilter.delete(blurFilter)
    api.ImageFilter.delete(colorFilter)
    api.ImageFilter.delete(composeFilter2)
    api.ImageFilter.delete(dropShadow)
    api.ImageFilter.delete(dropShadowOnly)

    api.Shader.delete(shader)
    api.Shader.delete(linear)
    api.Shader.delete(radial)
    api.Shader.delete(sweep)
    api.Shader.delete(conical)
    api.Shader.delete(imageShader)
    api.Shader.delete(imageShader2)

    api.Image.delete(encodedImage)
    api.Image.delete(snapshot)
    api.Image.delete(image)
    api.Path.deleteSkPath(skPath)
    api.Path.delete(path)
    api.Paint.delete(paintCopy)
    api.Paint.delete(paint)
    api.Surface.delete(swSurface)
    api.Surface.delete(surface)

    api.free(pointsPtr)
    api.free(m9Ptr)
    api.free(boundsPtr)
    api.free(outMatrixPtr)
    api.free(outRectPtr)
    api.free(vertsPtr)
    api.free(texPtr)
    api.free(vColorsPtr)
    api.free(colorsPtr)
    api.free(positionsPtr)
    api.free(matrixPtr)
    api.free(intervalsPtr)
    api.free(textPtr)
    api.free(ellipsisPtr)
    api.free(dstPtr)
    api.free(surfaceInfoPtr)
  })
})
