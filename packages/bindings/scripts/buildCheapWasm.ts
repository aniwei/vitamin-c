import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { spawnSync } from 'node:child_process'

function envFlag(name: string, fallback: string): string {
  const value = process.env[name]
  return value == null || value === '' ? fallback : value
}

async function listCodecObjects(codecDir: string): Promise<string[]> {
  const entries = await fs.readdir(codecDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.o'))
    .map((entry) => path.join(codecDir, entry.name))
}

async function main() {
  const root = process.cwd()
  const repoRoot = path.resolve(root, '..', '..')
  const skiaDir = path.resolve(repoRoot, 'packages/third-party/skia')

  const src = path.resolve(repoRoot, 'packages/bindings/native/canvaskit_cheap_bindings.cpp')
  const outDir = envFlag('CHEAP_WASM_OUT_DIR', path.resolve(repoRoot, 'packages/bindings/native'))
  const outFile = path.resolve(outDir, 'canvaskit_cheap.wasm')

  if (!existsSync(src)) {
    throw new Error(`Missing C++ source: ${src}`)
  }

  const skiaBuildDir = envFlag('SKIA_BUILD_DIR', path.resolve(skiaDir, 'out/canvaskit_wasm'))
  const codecDir = path.resolve(skiaBuildDir, 'obj/src/codec')

  if (!existsSync(path.resolve(skiaBuildDir, 'libskia.a'))) {
    throw new Error(`Missing libskia.a in ${skiaBuildDir}`)
  }

  if (!existsSync(codecDir)) {
    throw new Error(`Missing codec objects at ${codecDir}`)
  }

  const codecObjs = await listCodecObjects(codecDir)
  if (!codecObjs.length) {
    throw new Error(`No codec objects found in ${codecDir}`)
  }

  const emsdkDir = envFlag('EMSDK_DIR', path.resolve(skiaDir, 'third_party/externals/emsdk'))
  const emxx = envFlag('EMXX', path.resolve(emsdkDir, 'upstream/emscripten/em++'))

  if (!existsSync(emxx)) {
    throw new Error(`em++ not found at ${emxx}`)
  }

  await fs.mkdir(outDir, { recursive: true })

  const cheapWebGL = envFlag('CHEAP_WEBGL', '1') === '1'
  const cheapWebGPU = envFlag('CHEAP_WEBGPU', '0') === '1'
  const cheapMainModule = envFlag('CHEAP_MAIN_MODULE', '0')
  const cheapAssertions = envFlag('CHEAP_ASSERTIONS', '0')
  const cheapDebug = envFlag('CHEAP_DEBUG', '0') === '1'
  const cheapDebugSeparate = envFlag('CHEAP_DEBUG_SEPARATE', '0') === '1'
  const debugBasename = envFlag('CHEAP_DEBUG_FILE', 'canvaskit_cheap.debug.wasm')

  const debugFlags: string[] = []
  if (cheapDebug) {
    if (cheapDebugSeparate) {
      const debugPath = path.resolve(outDir, debugBasename)
      debugFlags.push('-g', `-gseparate-dwarf=${debugPath}`, `-sSEPARATE_DWARF_URL=${debugBasename}`)
    } else {
      debugFlags.push('-g')
    }
  } else {
    debugFlags.push('-g0')
  }

  const exported = [
    '_malloc',
    '_free',
    '_Data_bytes',
    '_Data_size',
    '_DeleteData',
    '_MakeCanvasSurface',
    '_MakeSWCanvasSurface',
    '_WebGL_CreateContext',
    '_WebGL_MakeContextCurrent',
    '_WebGL_DestroyContext',
    '_MakeOnScreenCanvasSurface',
    '_MakeOnScreenCanvasSurfaceEx',
    '_MakeGrContextWebGL',
    '_WebGL_GetSampleCount',
    '_WebGL_GetStencilBits',
    '_WebGL_GetLastError',
    '_MakeRenderTarget',
    '_MakeRenderTargetSurface',
    '_DeleteSurface',
    '_Surface_getCanvas',
    '_Surface_makeImageSnapshot',
    '_Surface_flush',
    '_Surface_width',
    '_Surface_height',
    '_Surface_encodeToPNG',
    '_Surface_readPixelsRGBA8888',
    '_Surface_makeImageFromTexture',
    '_MakePaint',
    '_DeletePaint',
    '_Paint_copy',
    '_Paint_setColor',
    '_Paint_setColor4f',
    '_Paint_getColor',
    '_Paint_setAntiAlias',
    '_Paint_isAntiAlias',
    '_Paint_setDither',
    '_Paint_isDither',
    '_Paint_setStyle',
    '_Paint_getStyle',
    '_Paint_setStrokeWidth',
    '_Paint_getStrokeWidth',
    '_Paint_setStrokeCap',
    '_Paint_getStrokeCap',
    '_Paint_setStrokeJoin',
    '_Paint_getStrokeJoin',
    '_Paint_setStrokeMiter',
    '_Paint_getStrokeMiter',
    '_Paint_setAlphaf',
    '_Paint_getAlphaf',
    '_Paint_setBlendMode',
    '_Paint_getBlendMode',
    '_Paint_setShader',
    '_Paint_setColorFilter',
    '_Paint_setMaskFilter',
    '_Paint_setPathEffect',
    '_Paint_setImageFilter',
    '_MakePath',
    '_DeletePath',
    '_Path_setFillType',
    '_Path_moveTo',
    '_Path_lineTo',
    '_Path_close',
    '_Path_reset',
    '_Path_getBounds',
    '_Path_quadTo',
    '_Path_cubicTo',
    '_Path_addRect',
    '_Path_addCircle',
    '_Path_addOval',
    '_Path_addRRectXY',
    '_Path_addPolygon',
    '_Path_addArc',
    '_Path_arcToOval',
    '_Path_snapshot',
    '_DeleteSkPath',
    '_Path_transform',
    '_SkPath_getBounds',
    '_Canvas_clear',
    '_Canvas_getSaveCount',
    '_Canvas_saveLayer',
    '_Canvas_save',
    '_Canvas_restore',
    '_Canvas_restoreToCount',
    '_Canvas_translate',
    '_Canvas_scale',
    '_Canvas_rotate',
    '_Canvas_drawOval',
    '_Canvas_drawArc',
    '_Canvas_drawPaint',
    '_Canvas_concat',
    '_Canvas_setMatrix',
    '_Canvas_clipRect',
    '_Canvas_drawRect',
    '_Canvas_drawPath',
    '_Canvas_drawSkPath',
    '_Canvas_drawCircle',
    '_Canvas_drawLine',
    '_Canvas_drawImage',
    '_Canvas_drawImageWithPaint',
    '_Canvas_drawImageRect',
    '_Canvas_drawImageRectWithPaint',
    '_Canvas_drawTextBlob',
    '_Canvas_drawParagraph',
    '_Canvas_clipPath',
    '_Canvas_clipRRect',
    '_Canvas_drawRRect',
    '_Canvas_drawDRRect',
    '_Canvas_drawPoints',
    '_Canvas_drawVertices',
    '_Canvas_skew',
    '_Canvas_resetMatrix',
    '_Canvas_getLocalToDevice',
    '_Canvas_getTotalMatrix',
    '_Canvas_getDeviceClipBounds',
    '_Canvas_getLocalClipBounds',
    '_Canvas_quickRejectRect',
    '_Canvas_quickRejectPath',
    '_MakeImageFromEncoded',
    '_MakeImageFromRGBA8888',
    '_DeleteImage',
    '_Image_width',
    '_Image_height',
    '_Image_alphaType',
    '_Image_colorType',
    '_Image_makeShader',
    '_Image_readPixelsRGBA8888',
    '_Image_encodeToPNG',
    '_DeleteShader',
    '_MakeColorShader',
    '_MakeLinearGradientShader',
    '_MakeRadialGradientShader',
    '_MakeSweepGradientShader',
    '_MakeTwoPointConicalGradientShader',
    '_MakeImageShader',
    '_DeleteColorFilter',
    '_MakeBlendColorFilter',
    '_MakeMatrixColorFilter',
    '_MakeComposeColorFilter',
    '_MakeLerpColorFilter',
    '_MakeSRGBToLinearGammaColorFilter',
    '_MakeLinearToSRGBGammaColorFilter',
    '_DeleteMaskFilter',
    '_MakeBlurMaskFilter',
    '_DeleteImageFilter',
    '_MakeBlurImageFilter',
    '_MakeColorFilterImageFilter',
    '_MakeComposeImageFilter',
    '_MakeDropShadowImageFilter',
    '_MakeDropShadowOnlyImageFilter',
    '_DeletePathEffect',
    '_MakeDashPathEffect',
    '_MakeDiscretePathEffect',
    '_MakeCornerPathEffect',
    '_MakeComposePathEffect',
    '_MakeSumPathEffect',
    '_MakeParagraphFromText',
    '_MakeParagraphFromTextWithEllipsis',
    '_Paragraph_layout',
    '_Paragraph_getHeight',
    '_Paragraph_getMaxWidth',
    '_Paragraph_getMinIntrinsicWidth',
    '_Paragraph_getMaxIntrinsicWidth',
    '_Paragraph_getLongestLine',
    '_DeleteParagraph',
    '_MakeParagraphBuilder',
    '_MakeParagraphBuilderWithEllipsis',
    '_ParagraphBuilder_pushStyle',
    '_ParagraphBuilder_pop',
    '_ParagraphBuilder_addText',
    '_ParagraphBuilder_build',
    '_DeleteParagraphBuilder',
    '_GetCurrentGrContext',
    '_GrContext_flush',
    '_GrContext_submit',
    '_GrContext_flushAndSubmit',
    '_GrContext_getResourceCacheLimitBytes',
    '_GrContext_getResourceCacheUsageBytes',
    '_GrContext_setResourceCacheLimitBytes',
    '_GrContext_releaseResourcesAndAbandonContext',
    '_GrContext_freeGpuResources',
    '_GrContext_performDeferredCleanup',
    '_MakeGPUTextureSurface',
    '_Surface_replaceBackendTexture',
    '_MakeGrContext',
  ]

  const exportList = `[${exported.map((name) => `'${name}'`).join(',')}]`

  const args = [
    '-O3',
    ...debugFlags,
    '-std=c++20',
    '-DSK_TRIVIAL_ABI=[[clang::trivial_abi]]',
    '-DSK_UNICODE_AVAILABLE',
    '-DSK_UNICODE_ICU_IMPLEMENTATION',
    ...(cheapWebGL ? ['-DCHEAP_WEBGL=1', '-lGL', '-sUSE_WEBGL2=1', '-sMAX_WEBGL_VERSION=2', '-sFULL_ES3=1'] : []),
    ...(cheapWebGPU ? ['-DCHEAP_WEBGPU=1', '-sUSE_WEBGPU=1'] : []),
    src,
    ...codecObjs,
    '-I',
    skiaDir,
    '-I',
    path.resolve(skiaDir, 'include/core'),
    '-I',
    path.resolve(skiaDir, 'include/effects'),
    '-I',
    path.resolve(skiaDir, 'include/gpu'),
    '-I',
    path.resolve(skiaDir, 'include/pathops'),
    '-I',
    path.resolve(skiaDir, 'include/utils'),
    '-L',
    skiaBuildDir,
    '-Wl,--start-group',
    '-lskia',
    '-lskparagraph',
    '-lskshaper',
    '-lskunicode_core',
    '-lskunicode_icu',
    '-lskcms',
    '-lwuffs',
    '-lharfbuzz',
    '-lfreetype2',
    '-licu',
    '-ljsonreader',
    '-lpng',
    '-lzlib',
    '-ljpeg',
    '-lwebp',
    '-lwebp_sse41',
    '-lbrotli',
    '-Wl,--end-group',
    '-sWASM=1',
    '-sFILESYSTEM=0',
    '-sFETCH=0',
    `-sASSERTIONS=${cheapAssertions}`,
    '-sIMPORTED_MEMORY=1',
    '-sALLOW_MEMORY_GROWTH=1',
    '-sALLOW_TABLE_GROWTH=1',
    '-sUSE_PTHREADS=0',
    `-sMAIN_MODULE=${cheapMainModule}`,
    '-sSIDE_MODULE=0',
    '-sMALLOC=emmalloc',
    '-sERROR_ON_UNDEFINED_SYMBOLS=0',
    `-sEXPORTED_FUNCTIONS=${exportList}`,
    '--no-entry',
    '-o',
    outFile,
  ]

  const result = spawnSync(emxx, args, { stdio: 'inherit' })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${emxx} exited with code ${result.status}`)
  }

  await fs.access(outFile)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
