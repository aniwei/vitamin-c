import { Api } from './Api'
import type { Ptr } from '../types'
import type { ClipOp, FilterMode, MipmapMode } from '../enums'

export class CanvasApi extends Api {
  clear(canvas: Ptr, argb: number): void {
    this.invoke('Canvas_clear', canvas, argb >>> 0)
  }

  getSaveCount(canvas: Ptr): number {
    return this.invoke('Canvas_getSaveCount', canvas) | 0
  }

  saveLayer(
    canvas: Ptr,
    l: number,
    t: number,
    r: number,
    b: number,
    hasBounds: boolean,
    paint: Ptr,
  ): number {
    return this.invoke('Canvas_saveLayer', canvas, +l, +t, +r, +b, hasBounds ? 1 : 0, paint >>> 0) | 0
  }

  save(canvas: Ptr): number {
    return this.invoke('Canvas_save', canvas) | 0
  }

  restore(canvas: Ptr): void {
    this.invoke('Canvas_restore', canvas)
  }

  restoreToCount(canvas: Ptr, saveCount: number): void {
    this.invoke('Canvas_restoreToCount', canvas, saveCount | 0)
  }

  translate(canvas: Ptr, dx: number, dy: number): void {
    this.invoke('Canvas_translate', canvas, +dx, +dy)
  }

  scale(canvas: Ptr, sx: number, sy: number): void {
    this.invoke('Canvas_scale', canvas, +sx, +sy)
  }

  rotate(canvas: Ptr, degrees: number): void {
    this.invoke('Canvas_rotate', canvas, +degrees)
  }

  drawOval(canvas: Ptr, l: number, t: number, r: number, b: number, paint: Ptr): void {
    this.invoke('Canvas_drawOval', canvas, +l, +t, +r, +b, paint)
  }

  drawArc(
    canvas: Ptr,
    l: number,
    t: number,
    r: number,
    b: number,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paint: Ptr,
  ): void {
    this.invoke('Canvas_drawArc', canvas, +l, +t, +r, +b, +startAngle, +sweepAngle, useCenter ? 1 : 0, paint)
  }

  drawPaint(canvas: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawPaint', canvas, paint)
  }

  concat(canvas: Ptr, m9Ptr: Ptr): void {
    this.invoke('Canvas_concat', canvas, m9Ptr >>> 0)
  }

  setMatrix(canvas: Ptr, m9Ptr: Ptr): void {
    this.invoke('Canvas_setMatrix', canvas, m9Ptr >>> 0)
  }

  clipRect(canvas: Ptr, l: number, t: number, r: number, b: number, clipOp: ClipOp, doAA: boolean): void {
    this.invoke('Canvas_clipRect', canvas, +l, +t, +r, +b, clipOp | 0, doAA ? 1 : 0)
  }

  drawRect(canvas: Ptr, l: number, t: number, r: number, b: number, paint: Ptr): void {
    this.invoke('Canvas_drawRect', canvas, +l, +t, +r, +b, paint)
  }

  drawPath(canvas: Ptr, path: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawPath', canvas, path, paint)
  }

  drawSkPath(canvas: Ptr, skPath: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawSkPath', canvas, skPath, paint)
  }

  drawCircle(canvas: Ptr, cx: number, cy: number, radius: number, paint: Ptr): void {
    this.invoke('Canvas_drawCircle', canvas, +cx, +cy, +radius, paint)
  }

  drawLine(canvas: Ptr, x0: number, y0: number, x1: number, y1: number, paint: Ptr): void {
    this.invoke('Canvas_drawLine', canvas, +x0, +y0, +x1, +y1, paint)
  }

  drawImage(canvas: Ptr, image: Ptr, x: number, y: number, filterMode: FilterMode, mipmapMode: MipmapMode): void {
    this.invoke('Canvas_drawImage', canvas, image, +x, +y, filterMode | 0, mipmapMode | 0)
  }

  drawImageWithPaint(
    canvas: Ptr,
    image: Ptr,
    x: number,
    y: number,
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    paint: Ptr
  ): void {
    this.invoke('Canvas_drawImageWithPaint', canvas, image, +x, +y, filterMode | 0, mipmapMode | 0, paint)
  }

  drawImageRect(
    canvas: Ptr,
    image: Ptr,
    srcL: number,
    srcT: number,
    srcR: number,
    srcB: number,
    dstL: number,
    dstT: number,
    dstR: number,
    dstB: number,
    filterMode: FilterMode,
    mipmapMode: MipmapMode
  ): void {
    this.invoke(
      'Canvas_drawImageRect',
      canvas,
      image,
      +srcL,
      +srcT,
      +srcR,
      +srcB,
      +dstL,
      +dstT,
      +dstR,
      +dstB,
      filterMode | 0,
      mipmapMode | 0
    )
  }

  drawImageRectWithPaint(
    canvas: Ptr,
    image: Ptr,
    srcL: number,
    srcT: number,
    srcR: number,
    srcB: number,
    dstL: number,
    dstT: number,
    dstR: number,
    dstB: number,
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    paint: Ptr
  ): void {
    this.invoke(
      'Canvas_drawImageRectWithPaint',
      canvas,
      image,
      +srcL,
      +srcT,
      +srcR,
      +srcB,
      +dstL,
      +dstT,
      +dstR,
      +dstB,
      filterMode | 0,
      mipmapMode | 0,
      paint
    )
  }

  drawTextBlob(canvas: Ptr, blob: Ptr, x: number, y: number, paint: Ptr): void {
    this.invoke('Canvas_drawTextBlob', canvas, blob, +x, +y, paint)
  }

  drawParagraph(canvas: Ptr, paragraph: Ptr, x: number, y: number): void {
    this.invoke('Canvas_drawParagraph', canvas, paragraph, +x, +y)
  }

  clipPath(canvas: Ptr, path: Ptr, clipOp: ClipOp, doAA: boolean): void {
    this.invoke('Canvas_clipPath', canvas, path >>> 0, clipOp | 0, doAA ? 1 : 0)
  }

  clipRRect(
    canvas: Ptr, 
    l: number, 
    t: number, 
    r: number, 
    b: number, 
    radiusX: number, 
    radiusY: number, 
    clipOp: ClipOp, 
    doAA: boolean
  ): void {
    this.invoke('Canvas_clipRRect', canvas, +l, +t, +r, +b, +radiusX, +radiusY, clipOp | 0, doAA ? 1 : 0)
  }

  drawRRect(
    canvas: Ptr, 
    l: number, 
    t: number, 
    r: number, 
    b: number, 
    radiusX: number, 
    radiusY: number, 
    paint: Ptr
  ): void {
    this.invoke('Canvas_drawRRect', canvas, +l, +t, +r, +b, +radiusX, +radiusY, paint >>> 0)
  }

  drawDRRect(
    canvas: Ptr,
    outerL: number,
    outerT: number,
    outerR: number,
    outerB: number,
    outerRadiusX: number,
    outerRadiusY: number,
    innerL: number,
    innerT: number,
    innerR: number,
    innerB: number,
    innerRadiusX: number,
    innerRadiusY: number,
    paint: Ptr
  ): void {
    this.invoke(
      'Canvas_drawDRRect',
      canvas,
      +outerL, +outerT, +outerR, +outerB, +outerRadiusX, +outerRadiusY,
      +innerL, +innerT, +innerR, +innerB, +innerRadiusX, +innerRadiusY,
      paint >>> 0
    )
  }

  drawPoints(canvas: Ptr, mode: number, pointsPtr: Ptr, count: number, paint: Ptr): void {
    this.invoke('Canvas_drawPoints', canvas, mode | 0, pointsPtr >>> 0, count | 0, paint >>> 0)
  }

  drawVertices(
    canvas: Ptr,
    mode: number,
    positionsPtr: Ptr,
    texCoordsPtr: Ptr,
    colorsPtr: Ptr,
    vertexCount: number,
    indicesPtr: Ptr,
    indexCount: number,
    blendMode: number,
    paint: Ptr
  ): void {
    this.invoke(
      'Canvas_drawVertices',
      canvas,
      mode | 0,
      positionsPtr >>> 0,
      texCoordsPtr >>> 0,
      colorsPtr >>> 0,
      vertexCount | 0,
      indicesPtr >>> 0,
      indexCount | 0,
      blendMode | 0,
      paint >>> 0
    )
  }

  skew(canvas: Ptr, sx: number, sy: number): void {
    this.invoke('Canvas_skew', canvas, +sx, +sy)
  }

  resetMatrix(canvas: Ptr): void {
    this.invoke('Canvas_resetMatrix', canvas)
  }

  getLocalToDevice(canvas: Ptr, outPtr: Ptr): void {
    this.invoke('Canvas_getLocalToDevice', canvas, outPtr >>> 0)
  }

  getTotalMatrix(canvas: Ptr, outPtr: Ptr): void {
    this.invoke('Canvas_getTotalMatrix', canvas, outPtr >>> 0)
  }

  getDeviceClipBounds(canvas: Ptr, outPtr: Ptr): void {
    this.invoke('Canvas_getDeviceClipBounds', canvas, outPtr >>> 0)
  }

  getLocalClipBounds(canvas: Ptr, outPtr: Ptr): void {
    this.invoke('Canvas_getLocalClipBounds', canvas, outPtr >>> 0)
  }

  quickRejectRect(canvas: Ptr, l: number, t: number, r: number, b: number): boolean {
    return !!this.invoke('Canvas_quickRejectRect', canvas, +l, +t, +r, +b)
  }

  quickRejectPath(canvas: Ptr, path: Ptr): boolean {
    return !!this.invoke('Canvas_quickRejectPath', canvas, path >>> 0)
  }
}
