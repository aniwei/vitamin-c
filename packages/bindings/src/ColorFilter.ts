import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import type { BlendMode } from './enums'

class ColorFilterPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.ColorFilter.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ColorFilterPtr {
    return new ColorFilterPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ColorFilterPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }
}

export class ColorFilter extends ManagedObj {
  static makeBlend(argb: number, blendMode: BlendMode): ColorFilter {
    const ptr = CanvasKitApi.ColorFilter.makeBlend(argb, blendMode) as number
    return new ColorFilter(new ColorFilterPtr(ptr))
  }

  static makeMatrix(matrix: number[]): ColorFilter {
    const matrixPtr = CanvasKitApi.malloc(20 * 4) as number
    try {
      CanvasKitApi.setFloat32Array(matrixPtr, matrix)
      const ptr = CanvasKitApi.ColorFilter.makeMatrix(matrixPtr) as number
      return new ColorFilter(new ColorFilterPtr(ptr))
    } finally {
      CanvasKitApi.free(matrixPtr)
    }
  }

  static makeCompose(outer: ColorFilter, inner: ColorFilter): ColorFilter {
    const ptr = CanvasKitApi.ColorFilter.makeCompose(outer.raw, inner.raw) as number
    return new ColorFilter(new ColorFilterPtr(ptr))
  }

  static makeLerp(t: number, dst: ColorFilter, src: ColorFilter): ColorFilter {
    const ptr = CanvasKitApi.ColorFilter.makeLerp(t, dst.raw, src.raw) as number
    return new ColorFilter(new ColorFilterPtr(ptr))
  }

  static makeSRGBToLinearGamma(): ColorFilter {
    const ptr = CanvasKitApi.ColorFilter.makeSRGBToLinearGamma() as number
    return new ColorFilter(new ColorFilterPtr(ptr))
  }

  static makeLinearToSRGBGamma(): ColorFilter {
    const ptr = CanvasKitApi.ColorFilter.makeLinearToSRGBGamma() as number
    return new ColorFilter(new ColorFilterPtr(ptr))
  }
}
