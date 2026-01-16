import { Api } from './Api'
import type { Ptr } from '../types'
import type { TileMode, FilterMode, MipmapMode } from '../enums'

export class ShaderApi extends Api {
  delete(shader: Ptr): void {
    this.invoke('DeleteShader', shader >>> 0)
  }

  makeColor(argb: number): Ptr {
    return this.invoke('MakeColorShader', argb >>> 0) as Ptr
  }

  makeLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    colorsPtr: Ptr,
    positionsPtr: Ptr,
    count: number,
    tileMode: TileMode,
  ): Ptr {
    return this.invoke(
      'MakeLinearGradientShader',
      +x0,
      +y0,
      +x1,
      +y1,
      colorsPtr >>> 0,
      positionsPtr >>> 0,
      count | 0,
      tileMode | 0,
    ) as Ptr
  }

  makeRadialGradient(
    cx: number,
    cy: number,
    radius: number,
    colorsPtr: Ptr,
    positionsPtr: Ptr,
    count: number,
    tileMode: TileMode
  ): Ptr {
    return this.invoke(
      'MakeRadialGradientShader',
      +cx,
      +cy,
      +radius,
      colorsPtr >>> 0,
      positionsPtr >>> 0,
      count | 0,
      tileMode | 0,
    ) as Ptr
  }

  makeSweepGradient(
    cx: number,
    cy: number,
    colorsPtr: Ptr,
    positionsPtr: Ptr,
    count: number,
    tileMode: TileMode,
    startAngle: number,
    endAngle: number
  ): Ptr {
    return this.invoke(
      'MakeSweepGradientShader',
      +cx,
      +cy,
      colorsPtr >>> 0,
      positionsPtr >>> 0,
      count | 0,
      tileMode | 0,
      +startAngle,
      +endAngle,
    ) as Ptr
  }

  makeTwoPointConicalGradient(
    startX: number,
    startY: number,
    startRadius: number,
    endX: number,
    endY: number,
    endRadius: number,
    colorsPtr: Ptr,
    positionsPtr: Ptr,
    count: number,
    tileMode: TileMode
  ): Ptr {
    return this.invoke(
      'MakeTwoPointConicalGradientShader',
      +startX,
      +startY,
      +startRadius,
      +endX,
      +endY,
      +endRadius,
      colorsPtr >>> 0,
      positionsPtr >>> 0,
      count | 0,
      tileMode | 0,
    ) as Ptr
  }

  makeImage(
    image: Ptr,
    tileModeX: TileMode,
    tileModeY: TileMode,
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    matrixPtr: Ptr
  ): Ptr {
    return this.invoke(
      'MakeImageShader',
      image >>> 0,
      tileModeX | 0,
      tileModeY | 0,
      filterMode | 0,
      mipmapMode | 0,
      matrixPtr >>> 0,
    ) as Ptr
  }
}
