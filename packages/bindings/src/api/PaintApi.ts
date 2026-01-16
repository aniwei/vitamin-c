import type { Ptr } from '../types'
import { Api } from './Api'
import type { PaintStyle } from '../enums'

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

export class PaintApi extends Api {
  make(): Ptr {
    return this.invoke('MakePaint')
  }

  delete(paint: Ptr): void {
    this.invoke('DeletePaint', paint)
  }

  copy(paint: Ptr): Ptr {
    return this.invoke('Paint_copy', paint)
  }

  setColor(paint: Ptr, argb: number): void {
    this.invoke('Paint_setColor', paint, argb >>> 0)
  }

  setColor4f(paint: Ptr, r: number, g: number, b: number, a: number): void {
    this.invoke('Paint_setColor4f', paint, +r, +g, +b, +a)
  }

  getColor(paint: Ptr): number {
    return this.invoke('Paint_getColor', paint) >>> 0
  }

  setAntiAlias(paint: Ptr, aa: boolean): void {
    this.invoke('Paint_setAntiAlias', paint, aa ? 1 : 0)
  }

  isAntiAlias(paint: Ptr): boolean {
    return this.invoke('Paint_isAntiAlias', paint) !== 0
  }

  setDither(paint: Ptr, dither: boolean): void {
    this.invoke('Paint_setDither', paint, dither ? 1 : 0)
  }

  isDither(paint: Ptr): boolean {
    return this.invoke('Paint_isDither', paint) !== 0
  }

  setStyle(paint: Ptr, style: PaintStyle): void {
    this.invoke('Paint_setStyle', paint, style | 0)
  }

  getStyle(paint: Ptr): PaintStyle {
    return this.invoke('Paint_getStyle', paint) | 0
  }

  setStrokeWidth(paint: Ptr, width: number): void {
    this.invoke('Paint_setStrokeWidth', paint, +width)
  }

  getStrokeWidth(paint: Ptr): number {
    return this.invoke('Paint_getStrokeWidth', paint)
  }

  setStrokeCap(paint: Ptr, cap: StrokeCap): void {
    this.invoke('Paint_setStrokeCap', paint, cap | 0)
  }

  getStrokeCap(paint: Ptr): StrokeCap {
    return this.invoke('Paint_getStrokeCap', paint) | 0
  }

  setStrokeJoin(paint: Ptr, join: StrokeJoin): void {
    this.invoke('Paint_setStrokeJoin', paint, join | 0)
  }

  getStrokeJoin(paint: Ptr): StrokeJoin {
    return this.invoke('Paint_getStrokeJoin', paint) | 0
  }

  setStrokeMiter(paint: Ptr, miter: number): void {
    this.invoke('Paint_setStrokeMiter', paint, +miter)
  }

  getStrokeMiter(paint: Ptr): number {
    return this.invoke('Paint_getStrokeMiter', paint)
  }

  setAlphaf(paint: Ptr, a: number): void {
    this.invoke('Paint_setAlphaf', paint, +a)
  }

  getAlphaf(paint: Ptr): number {
    return this.invoke('Paint_getAlphaf', paint)
  }

  setBlendMode(paint: Ptr, mode: number): void {
    this.invoke('Paint_setBlendMode', paint, mode | 0)
  }

  getBlendMode(paint: Ptr): number {
    return this.invoke('Paint_getBlendMode', paint) | 0
  }

  setShader(paint: Ptr, shader: Ptr): void {
    this.invoke('Paint_setShader', paint, shader)
  }

  setColorFilter(paint: Ptr, colorFilter: Ptr): void {
    this.invoke('Paint_setColorFilter', paint, colorFilter)
  }

  setMaskFilter(paint: Ptr, maskFilter: Ptr): void {
    this.invoke('Paint_setMaskFilter', paint, maskFilter)
  }

  setPathEffect(paint: Ptr, pathEffect: Ptr): void {
    this.invoke('Paint_setPathEffect', paint, pathEffect)
  }

  setImageFilter(paint: Ptr, imageFilter: Ptr): void {
    this.invoke('Paint_setImageFilter', paint, imageFilter)
  }
}
