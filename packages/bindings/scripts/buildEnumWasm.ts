import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { spawnSync } from 'node:child_process'

function envFlag(name: string, fallback: string): string {
  const value = process.env[name]
  return value == null || value === '' ? fallback : value
}

const exportedFunctions = [
  'SkPathFillType_Winding',
  'SkPathFillType_EvenOdd',
  'SkPathFillType_InverseWinding',
  'SkPathFillType_InverseEvenOdd',
  'SkPaintStyle_Fill',
  'SkPaintStyle_Stroke',
  'SkPaintStyle_StrokeAndFill',
  'SkFilterMode_Nearest',
  'SkFilterMode_Linear',
  'SkMipmapMode_None',
  'SkMipmapMode_Nearest',
  'SkMipmapMode_Linear',
  'SkTileMode_Clamp',
  'SkTileMode_Repeat',
  'SkTileMode_Mirror',
  'SkTileMode_Decal',
  'SkClipOp_Difference',
  'SkClipOp_Intersect',
  'SkTextDirection_LTR',
  'SkTextDirection_RTL',
  'SkTextAlign_Left',
  'SkTextAlign_Right',
  'SkTextAlign_Center',
  'SkTextAlign_Justify',
  'SkTextAlign_Start',
  'SkTextAlign_End',
  'SkBlendMode_Clear',
  'SkBlendMode_Src',
  'SkBlendMode_Dst',
  'SkBlendMode_SrcOver',
  'SkBlendMode_DstOver',
  'SkBlendMode_SrcIn',
  'SkBlendMode_DstIn',
  'SkBlendMode_SrcOut',
  'SkBlendMode_DstOut',
  'SkBlendMode_SrcATop',
  'SkBlendMode_DstATop',
  'SkBlendMode_Xor',
  'SkBlendMode_Plus',
  'SkBlendMode_Modulate',
  'SkBlendMode_Screen',
  'SkBlendMode_Overlay',
  'SkBlendMode_Darken',
  'SkBlendMode_Lighten',
  'SkBlendMode_ColorDodge',
  'SkBlendMode_ColorBurn',
  'SkBlendMode_HardLight',
  'SkBlendMode_SoftLight',
  'SkBlendMode_Difference',
  'SkBlendMode_Exclusion',
  'SkBlendMode_Multiply',
  'SkBlendMode_Hue',
  'SkBlendMode_Saturation',
  'SkBlendMode_Color',
  'SkBlendMode_Luminosity',
  'SkStrokeCap_Butt',
  'SkStrokeCap_Round',
  'SkStrokeCap_Square',
  'SkStrokeJoin_Miter',
  'SkStrokeJoin_Round',
  'SkStrokeJoin_Bevel',
  'SkBlurStyle_Normal',
  'SkBlurStyle_Solid',
  'SkBlurStyle_Outer',
  'SkBlurStyle_Inner',
  'SkPointMode_Points',
  'SkPointMode_Lines',
  'SkPointMode_Polygon',
  'SkVertexMode_Triangles',
  'SkVertexMode_TriangleStrip',
  'SkVertexMode_TriangleFan',
  'SkAlphaType_Unknown',
  'SkAlphaType_Opaque',
  'SkAlphaType_Premul',
  'SkAlphaType_Unpremul',
  'SkColorType_Unknown',
  'SkColorType_Alpha8',
  'SkColorType_RGB565',
  'SkColorType_ARGB4444',
  'SkColorType_RGBA8888',
  'SkColorType_BGRA8888',
  'SkColorType_RGBA_F16',
  'SkColorType_RGBA_F32',
]

async function main() {
  const root = process.cwd()
  const src = path.resolve(root, 'native/enum_exports.cpp')
  const out = path.resolve(root, 'native/enum-exports.wasm')

  if (!existsSync(src)) {
    throw new Error(`Missing C++ source: ${src}`)
  }

  const repoRoot = path.resolve(root, '..', '..')
  const skiaDir = path.resolve(repoRoot, 'packages/third-party/skia')
  const emsdkDir = envFlag('EMSDK_DIR', path.resolve(skiaDir, 'third_party/externals/emsdk'))
  const emcc = envFlag('EMCC', path.resolve(emsdkDir, 'upstream/emscripten/emcc'))

  if (!existsSync(emcc)) {
    throw new Error(`emcc not found at ${emcc}`)
  }
  const exportList = JSON.stringify(exportedFunctions.map((name) => `_${name}`))

  const args = [
    src,
    '-O3',
    '-std=c++17',
    '-s',
    'STANDALONE_WASM=1',
    '-s',
    `EXPORTED_FUNCTIONS=${exportList}`,
    '--no-entry',
    '-o',
    out,
  ]

  const result = spawnSync(emcc, args, { stdio: 'inherit' })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${emcc} exited with code ${result.status}`)
  }

  await fs.access(out)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
