export enum PathFillType {
  Winding = 0,
  EvenOdd = 1,
  InverseWinding = 2,
  InverseEvenOdd = 3,
}

export enum PaintStyle {
  Fill = 0,
  Stroke = 1,
  StrokeAndFill = 2,
}

export enum FilterMode {
  Nearest = 0,
  Linear = 1,
}

export enum MipmapMode {
  None = 0,
  Nearest = 1,
  Linear = 2,
}

export enum TileMode {
  Clamp = 0,
  Repeat = 1,
  Mirror = 2,
  Decal = 3,
}

export enum ClipOp {
  Difference = 0,
  Intersect = 1,
}

export enum Clip {
  None = 0,
  HardEdge = 1,
  AntiAlias = 2,
  AntiAliasWithSaveLayer = 3,
}

export enum TextDirection {
  LTR = 1,
  RTL = 0,
}

export enum TextAlign {
  Left = 0,
  Right = 1,
  Center = 2,
  Justify = 3,
  Start = 4,
  End = 5,
}

export enum BlendMode {
  Clear = 0,
  Src = 1,
  Dst = 2,
  SrcOver = 3,
  DstOver = 4,
  SrcIn = 5,
  DstIn = 6,
  SrcOut = 7,
  DstOut = 8,
  SrcATop = 9,
  DstATop = 10,
  Xor = 11,
  Plus = 12,
  Modulate = 13,
  Screen = 14,
  Overlay = 15,
  Darken = 16,
  Lighten = 17,
  ColorDodge = 18,
  ColorBurn = 19,
  HardLight = 20,
  SoftLight = 21,
  Difference = 22,
  Exclusion = 23,
  Multiply = 24,
  Hue = 25,
  Saturation = 26,
  Color = 27,
  Luminosity = 28,
}

export enum StrokeCap {
  Butt = 0,
  Round = 1,
  Square = 2,
}

export enum StrokeJoin {
  Miter = 0,
  Round = 1,
  Bevel = 2,
}

export enum BlurStyle {
  Normal = 0,
  Solid = 1,
  Outer = 2,
  Inner = 3,
}

export enum PointMode {
  Points = 0,
  Lines = 1,
  Polygon = 2,
}

export enum VertexMode {
  Triangles = 0,
  TriangleStrip = 1,
  TriangleFan = 2,
}

export enum AlphaType {
  Unknown = 0,
  Opaque = 1,
  Premul = 2,
  Unpremul = 3,
}

export enum ColorType {
  Unknown = 0,
  Alpha_8 = 1,
  RGB_565 = 2,
  ARGB_4444 = 3,
  RGBA_8888 = 4,
  BGRA_8888 = 6,
  RGBA_F16 = 16,
  RGBA_F32 = 18,
}