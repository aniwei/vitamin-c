import * as path from 'path'
import * as fs from 'fs/promises'
import { EnumApi } from '../src/EnumApi'

function tryInvoke(name: string, fallback: number): number {
  try {
    return EnumApi.invoke(name)
  } catch {
    return fallback
  }
}

async function main() {
  const wasmPath =
    process.env.ENUM_EXPORT_WASM ||
    process.env.ENUM_WASM ||
    path.resolve(process.cwd(), 'native/enum-exports.wasm')

  try {
    await EnumApi.ready({ path: wasmPath })
  } catch (err) {
    console.warn(`[gen:canvaskitapi] Failed to load enum wasm at ${wasmPath}. Keeping existing enums.`)
    console.warn(err)
    return
  }

  const winding = EnumApi.invoke('SkPathFillType_Winding')
  const evenOdd = EnumApi.invoke('SkPathFillType_EvenOdd')
  const inverseWinding = EnumApi.invoke('SkPathFillType_InverseWinding')
  const inverseEvenOdd = EnumApi.invoke('SkPathFillType_InverseEvenOdd')

  const paintStyleFill = EnumApi.invoke('SkPaintStyle_Fill')
  const paintStyleStroke = EnumApi.invoke('SkPaintStyle_Stroke')
  const paintStyleStrokeAndFill = EnumApi.invoke('SkPaintStyle_StrokeAndFill')

  const filterModeNearest = EnumApi.invoke('SkFilterMode_Nearest')
  const filterModeLinear = EnumApi.invoke('SkFilterMode_Linear')

  const mipmapModeNone = EnumApi.invoke('SkMipmapMode_None')
  const mipmapModeNearest = EnumApi.invoke('SkMipmapMode_Nearest')
  const mipmapModeLinear = EnumApi.invoke('SkMipmapMode_Linear')

  // NOTE: TileMode 在部分 cheap wasm 版本里可能还没有导出；这里做兼容回退。
  const tileModeClamp = tryInvoke('SkTileMode_Clamp', 0)
  const tileModeRepeat = tryInvoke('SkTileMode_Repeat', 1)
  const tileModeMirror = tryInvoke('SkTileMode_Mirror', 2)
  const tileModeDecal = tryInvoke('SkTileMode_Decal', 3)

  const clipOpDifference = EnumApi.invoke('SkClipOp_Difference')
  const clipOpIntersect = EnumApi.invoke('SkClipOp_Intersect')

  const textDirectionLtr = EnumApi.invoke('SkTextDirection_LTR')
  const textDirectionRtl = EnumApi.invoke('SkTextDirection_RTL')

  const textAlignLeft = EnumApi.invoke('SkTextAlign_Left')
  const textAlignRight = EnumApi.invoke('SkTextAlign_Right')
  const textAlignCenter = EnumApi.invoke('SkTextAlign_Center')
  const textAlignJustify = EnumApi.invoke('SkTextAlign_Justify')
  const textAlignStart = EnumApi.invoke('SkTextAlign_Start')
  const textAlignEnd = EnumApi.invoke('SkTextAlign_End')

  const js = []
  js.push(`export enum PathFillType {`)
  js.push(`  Winding = ${winding},`)
  js.push(`  EvenOdd = ${evenOdd},`)
  js.push(`  InverseWinding = ${inverseWinding},`)
  js.push(`  InverseEvenOdd = ${inverseEvenOdd},`)
  js.push(`}`)

  js.push('')
  js.push('export enum PaintStyle {')
  js.push(`  Fill = ${paintStyleFill},`)
  js.push(`  Stroke = ${paintStyleStroke},`)
  js.push(`  StrokeAndFill = ${paintStyleStrokeAndFill},`)
  js.push('}')

  js.push('')
  js.push('export enum FilterMode {')
  js.push(`  Nearest = ${filterModeNearest},`)
  js.push(`  Linear = ${filterModeLinear},`)
  js.push('}')

  js.push('')
  js.push('export enum MipmapMode {')
  js.push(`  None = ${mipmapModeNone},`)
  js.push(`  Nearest = ${mipmapModeNearest},`)
  js.push(`  Linear = ${mipmapModeLinear},`)
  js.push('}')

  js.push('')
  js.push('export enum TileMode {')
  js.push(`  Clamp = ${tileModeClamp},`)
  js.push(`  Repeat = ${tileModeRepeat},`)
  js.push(`  Mirror = ${tileModeMirror},`)
  js.push(`  Decal = ${tileModeDecal},`)
  js.push('}')

  js.push('')
  js.push('export enum ClipOp {')
  js.push(`  Difference = ${clipOpDifference},`)
  js.push(`  Intersect = ${clipOpIntersect},`)
  js.push('}')

  // Clip is a framework-level enum (not a Sk* wasm-exported enum).
  // Keep numeric values aligned with Flutter/engine conventions.
  js.push('')
  js.push('export enum Clip {')
  js.push('  None = 0,')
  js.push('  HardEdge = 1,')
  js.push('  AntiAlias = 2,')
  js.push('  AntiAliasWithSaveLayer = 3,')
  js.push('}')

  js.push('')
  js.push('export enum TextDirection {')
  js.push(`  LTR = ${textDirectionLtr},`)
  js.push(`  RTL = ${textDirectionRtl},`)
  js.push('}')

  js.push('')
  js.push('export enum TextAlign {')
  js.push(`  Left = ${textAlignLeft},`)
  js.push(`  Right = ${textAlignRight},`)
  js.push(`  Center = ${textAlignCenter},`)
  js.push(`  Justify = ${textAlignJustify},`)
  js.push(`  Start = ${textAlignStart},`)
  js.push(`  End = ${textAlignEnd},`)
  js.push('}')

  // BlendMode
  js.push('')
  js.push('export enum BlendMode {')
  js.push(`  Clear = ${tryInvoke('SkBlendMode_Clear', 0)},`)
  js.push(`  Src = ${tryInvoke('SkBlendMode_Src', 1)},`)
  js.push(`  Dst = ${tryInvoke('SkBlendMode_Dst', 2)},`)
  js.push(`  SrcOver = ${tryInvoke('SkBlendMode_SrcOver', 3)},`)
  js.push(`  DstOver = ${tryInvoke('SkBlendMode_DstOver', 4)},`)
  js.push(`  SrcIn = ${tryInvoke('SkBlendMode_SrcIn', 5)},`)
  js.push(`  DstIn = ${tryInvoke('SkBlendMode_DstIn', 6)},`)
  js.push(`  SrcOut = ${tryInvoke('SkBlendMode_SrcOut', 7)},`)
  js.push(`  DstOut = ${tryInvoke('SkBlendMode_DstOut', 8)},`)
  js.push(`  SrcATop = ${tryInvoke('SkBlendMode_SrcATop', 9)},`)
  js.push(`  DstATop = ${tryInvoke('SkBlendMode_DstATop', 10)},`)
  js.push(`  Xor = ${tryInvoke('SkBlendMode_Xor', 11)},`)
  js.push(`  Plus = ${tryInvoke('SkBlendMode_Plus', 12)},`)
  js.push(`  Modulate = ${tryInvoke('SkBlendMode_Modulate', 13)},`)
  js.push(`  Screen = ${tryInvoke('SkBlendMode_Screen', 14)},`)
  js.push(`  Overlay = ${tryInvoke('SkBlendMode_Overlay', 15)},`)
  js.push(`  Darken = ${tryInvoke('SkBlendMode_Darken', 16)},`)
  js.push(`  Lighten = ${tryInvoke('SkBlendMode_Lighten', 17)},`)
  js.push(`  ColorDodge = ${tryInvoke('SkBlendMode_ColorDodge', 18)},`)
  js.push(`  ColorBurn = ${tryInvoke('SkBlendMode_ColorBurn', 19)},`)
  js.push(`  HardLight = ${tryInvoke('SkBlendMode_HardLight', 20)},`)
  js.push(`  SoftLight = ${tryInvoke('SkBlendMode_SoftLight', 21)},`)
  js.push(`  Difference = ${tryInvoke('SkBlendMode_Difference', 22)},`)
  js.push(`  Exclusion = ${tryInvoke('SkBlendMode_Exclusion', 23)},`)
  js.push(`  Multiply = ${tryInvoke('SkBlendMode_Multiply', 24)},`)
  js.push(`  Hue = ${tryInvoke('SkBlendMode_Hue', 25)},`)
  js.push(`  Saturation = ${tryInvoke('SkBlendMode_Saturation', 26)},`)
  js.push(`  Color = ${tryInvoke('SkBlendMode_Color', 27)},`)
  js.push(`  Luminosity = ${tryInvoke('SkBlendMode_Luminosity', 28)},`)
  js.push('}')

  // StrokeCap
  js.push('')
  js.push('export enum StrokeCap {')
  js.push(`  Butt = ${tryInvoke('SkStrokeCap_Butt', 0)},`)
  js.push(`  Round = ${tryInvoke('SkStrokeCap_Round', 1)},`)
  js.push(`  Square = ${tryInvoke('SkStrokeCap_Square', 2)},`)
  js.push('}')

  // StrokeJoin
  js.push('')
  js.push('export enum StrokeJoin {')
  js.push(`  Miter = ${tryInvoke('SkStrokeJoin_Miter', 0)},`)
  js.push(`  Round = ${tryInvoke('SkStrokeJoin_Round', 1)},`)
  js.push(`  Bevel = ${tryInvoke('SkStrokeJoin_Bevel', 2)},`)
  js.push('}')

  // BlurStyle
  js.push('')
  js.push('export enum BlurStyle {')
  js.push(`  Normal = ${tryInvoke('SkBlurStyle_Normal', 0)},`)
  js.push(`  Solid = ${tryInvoke('SkBlurStyle_Solid', 1)},`)
  js.push(`  Outer = ${tryInvoke('SkBlurStyle_Outer', 2)},`)
  js.push(`  Inner = ${tryInvoke('SkBlurStyle_Inner', 3)},`)
  js.push('}')

  // PointMode
  js.push('')
  js.push('export enum PointMode {')
  js.push(`  Points = ${tryInvoke('SkPointMode_Points', 0)},`)
  js.push(`  Lines = ${tryInvoke('SkPointMode_Lines', 1)},`)
  js.push(`  Polygon = ${tryInvoke('SkPointMode_Polygon', 2)},`)
  js.push('}')

  // VertexMode
  js.push('')
  js.push('export enum VertexMode {')
  js.push(`  Triangles = ${tryInvoke('SkVertexMode_Triangles', 0)},`)
  js.push(`  TriangleStrip = ${tryInvoke('SkVertexMode_TriangleStrip', 1)},`)
  js.push(`  TriangleFan = ${tryInvoke('SkVertexMode_TriangleFan', 2)},`)
  js.push('}')

  // AlphaType
  js.push('')
  js.push('export enum AlphaType {')
  js.push(`  Unknown = ${tryInvoke('SkAlphaType_Unknown', 0)},`)
  js.push(`  Opaque = ${tryInvoke('SkAlphaType_Opaque', 1)},`)
  js.push(`  Premul = ${tryInvoke('SkAlphaType_Premul', 2)},`)
  js.push(`  Unpremul = ${tryInvoke('SkAlphaType_Unpremul', 3)},`)
  js.push('}')

  // ColorType
  js.push('')
  js.push('export enum ColorType {')
  js.push(`  Unknown = ${tryInvoke('SkColorType_Unknown', 0)},`)
  js.push(`  Alpha_8 = ${tryInvoke('SkColorType_Alpha8', 1)},`)
  js.push(`  RGB_565 = ${tryInvoke('SkColorType_RGB565', 2)},`)
  js.push(`  ARGB_4444 = ${tryInvoke('SkColorType_ARGB4444', 3)},`)
  js.push(`  RGBA_8888 = ${tryInvoke('SkColorType_RGBA8888', 4)},`)
  js.push(`  BGRA_8888 = ${tryInvoke('SkColorType_BGRA8888', 6)},`)
  js.push(`  RGBA_F16 = ${tryInvoke('SkColorType_RGBA_F16', 13)},`)
  js.push(`  RGBA_F32 = ${tryInvoke('SkColorType_RGBA_F32', 14)},`)
  js.push('}')

  await fs.writeFile(
    path.resolve(process.cwd(), 'src/enums.ts'),
    js.join('\n')
  )
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})