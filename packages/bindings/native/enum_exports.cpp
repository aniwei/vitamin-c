#if defined(__EMSCRIPTEN__)
#include <emscripten/emscripten.h>
#define ENUM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define ENUM_EXPORT __attribute__((used))
#endif

// NOTE: These values mirror Skia headers in packages/third-party/skia.
// We export them as simple functions to keep the WASM surface minimal and stable.

extern "C" {
// SkPathFillType (include/core/SkPathTypes.h)
ENUM_EXPORT int SkPathFillType_Winding() { return 0; }
ENUM_EXPORT int SkPathFillType_EvenOdd() { return 1; }
ENUM_EXPORT int SkPathFillType_InverseWinding() { return 2; }
ENUM_EXPORT int SkPathFillType_InverseEvenOdd() { return 3; }

// SkPaint::Style (include/core/SkPaint.h)
ENUM_EXPORT int SkPaintStyle_Fill() { return 0; }
ENUM_EXPORT int SkPaintStyle_Stroke() { return 1; }
ENUM_EXPORT int SkPaintStyle_StrokeAndFill() { return 2; }

// SkFilterMode (include/core/SkSamplingOptions.h)
ENUM_EXPORT int SkFilterMode_Nearest() { return 0; }
ENUM_EXPORT int SkFilterMode_Linear() { return 1; }

// SkMipmapMode (include/core/SkSamplingOptions.h)
ENUM_EXPORT int SkMipmapMode_None() { return 0; }
ENUM_EXPORT int SkMipmapMode_Nearest() { return 1; }
ENUM_EXPORT int SkMipmapMode_Linear() { return 2; }

// SkTileMode (include/core/SkTileMode.h)
ENUM_EXPORT int SkTileMode_Clamp() { return 0; }
ENUM_EXPORT int SkTileMode_Repeat() { return 1; }
ENUM_EXPORT int SkTileMode_Mirror() { return 2; }
ENUM_EXPORT int SkTileMode_Decal() { return 3; }

// SkClipOp (include/core/SkClipOp.h)
ENUM_EXPORT int SkClipOp_Difference() { return 0; }
ENUM_EXPORT int SkClipOp_Intersect() { return 1; }

// TextDirection / TextAlign (modules/skparagraph/include/DartTypes.h)
ENUM_EXPORT int SkTextDirection_LTR() { return 1; }
ENUM_EXPORT int SkTextDirection_RTL() { return 0; }

ENUM_EXPORT int SkTextAlign_Left() { return 0; }
ENUM_EXPORT int SkTextAlign_Right() { return 1; }
ENUM_EXPORT int SkTextAlign_Center() { return 2; }
ENUM_EXPORT int SkTextAlign_Justify() { return 3; }
ENUM_EXPORT int SkTextAlign_Start() { return 4; }
ENUM_EXPORT int SkTextAlign_End() { return 5; }

// SkBlendMode (include/core/SkBlendMode.h)
ENUM_EXPORT int SkBlendMode_Clear() { return 0; }
ENUM_EXPORT int SkBlendMode_Src() { return 1; }
ENUM_EXPORT int SkBlendMode_Dst() { return 2; }
ENUM_EXPORT int SkBlendMode_SrcOver() { return 3; }
ENUM_EXPORT int SkBlendMode_DstOver() { return 4; }
ENUM_EXPORT int SkBlendMode_SrcIn() { return 5; }
ENUM_EXPORT int SkBlendMode_DstIn() { return 6; }
ENUM_EXPORT int SkBlendMode_SrcOut() { return 7; }
ENUM_EXPORT int SkBlendMode_DstOut() { return 8; }
ENUM_EXPORT int SkBlendMode_SrcATop() { return 9; }
ENUM_EXPORT int SkBlendMode_DstATop() { return 10; }
ENUM_EXPORT int SkBlendMode_Xor() { return 11; }
ENUM_EXPORT int SkBlendMode_Plus() { return 12; }
ENUM_EXPORT int SkBlendMode_Modulate() { return 13; }
ENUM_EXPORT int SkBlendMode_Screen() { return 14; }
ENUM_EXPORT int SkBlendMode_Overlay() { return 15; }
ENUM_EXPORT int SkBlendMode_Darken() { return 16; }
ENUM_EXPORT int SkBlendMode_Lighten() { return 17; }
ENUM_EXPORT int SkBlendMode_ColorDodge() { return 18; }
ENUM_EXPORT int SkBlendMode_ColorBurn() { return 19; }
ENUM_EXPORT int SkBlendMode_HardLight() { return 20; }
ENUM_EXPORT int SkBlendMode_SoftLight() { return 21; }
ENUM_EXPORT int SkBlendMode_Difference() { return 22; }
ENUM_EXPORT int SkBlendMode_Exclusion() { return 23; }
ENUM_EXPORT int SkBlendMode_Multiply() { return 24; }
ENUM_EXPORT int SkBlendMode_Hue() { return 25; }
ENUM_EXPORT int SkBlendMode_Saturation() { return 26; }
ENUM_EXPORT int SkBlendMode_Color() { return 27; }
ENUM_EXPORT int SkBlendMode_Luminosity() { return 28; }

// SkPaint::Cap (include/core/SkPaint.h)
ENUM_EXPORT int SkStrokeCap_Butt() { return 0; }
ENUM_EXPORT int SkStrokeCap_Round() { return 1; }
ENUM_EXPORT int SkStrokeCap_Square() { return 2; }

// SkPaint::Join (include/core/SkPaint.h)
ENUM_EXPORT int SkStrokeJoin_Miter() { return 0; }
ENUM_EXPORT int SkStrokeJoin_Round() { return 1; }
ENUM_EXPORT int SkStrokeJoin_Bevel() { return 2; }

// SkBlurStyle (include/core/SkBlurTypes.h)
ENUM_EXPORT int SkBlurStyle_Normal() { return 0; }
ENUM_EXPORT int SkBlurStyle_Solid() { return 1; }
ENUM_EXPORT int SkBlurStyle_Outer() { return 2; }
ENUM_EXPORT int SkBlurStyle_Inner() { return 3; }

// SkCanvas::PointMode (include/core/SkCanvas.h)
ENUM_EXPORT int SkPointMode_Points() { return 0; }
ENUM_EXPORT int SkPointMode_Lines() { return 1; }
ENUM_EXPORT int SkPointMode_Polygon() { return 2; }

// SkVertices::VertexMode (include/core/SkVertices.h)
ENUM_EXPORT int SkVertexMode_Triangles() { return 0; }
ENUM_EXPORT int SkVertexMode_TriangleStrip() { return 1; }
ENUM_EXPORT int SkVertexMode_TriangleFan() { return 2; }

// SkAlphaType (include/core/SkAlphaType.h)
ENUM_EXPORT int SkAlphaType_Unknown() { return 0; }
ENUM_EXPORT int SkAlphaType_Opaque() { return 1; }
ENUM_EXPORT int SkAlphaType_Premul() { return 2; }
ENUM_EXPORT int SkAlphaType_Unpremul() { return 3; }

// SkColorType (include/core/SkColorType.h)
ENUM_EXPORT int SkColorType_Unknown() { return 0; }
ENUM_EXPORT int SkColorType_Alpha8() { return 1; }
ENUM_EXPORT int SkColorType_RGB565() { return 2; }
ENUM_EXPORT int SkColorType_ARGB4444() { return 3; }
ENUM_EXPORT int SkColorType_RGBA8888() { return 4; }
ENUM_EXPORT int SkColorType_BGRA8888() { return 6; }
ENUM_EXPORT int SkColorType_RGBA_F16() { return 16; }
ENUM_EXPORT int SkColorType_RGBA_F32() { return 18; }
}
