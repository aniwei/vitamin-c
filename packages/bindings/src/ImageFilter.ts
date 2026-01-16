import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { TileMode } from './enums'
import type { ColorFilter } from './ColorFilter'

class ImageFilterPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.ImageFilter.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ImageFilterPtr {
    return new ImageFilterPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ImageFilterPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }
}

export class ImageFilter extends ManagedObj {
  static makeBlur(sigmaX: number, sigmaY: number, tileMode: TileMode = TileMode.Clamp, input?: ImageFilter): ImageFilter {
    const inputPtr = input ? input.raw : 0
    const ptr = CanvasKitApi.ImageFilter.makeBlur(sigmaX, sigmaY, tileMode, inputPtr) as number
    return new ImageFilter(new ImageFilterPtr(ptr))
  }

  static makeColorFilter(colorFilter: ColorFilter, input?: ImageFilter): ImageFilter {
    const inputPtr = input ? input.raw : 0
    const ptr = CanvasKitApi.ImageFilter.makeColorFilter(colorFilter.raw, inputPtr) as number
    return new ImageFilter(new ImageFilterPtr(ptr))
  }

  static makeCompose(outer: ImageFilter, inner: ImageFilter): ImageFilter {
    const ptr = CanvasKitApi.ImageFilter.makeCompose(outer.raw, inner.raw) as number
    return new ImageFilter(new ImageFilterPtr(ptr))
  }

  static makeDropShadow(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    argb: number,
    input?: ImageFilter
  ): ImageFilter {
    const inputPtr = input ? input.raw : 0
    const ptr = CanvasKitApi.ImageFilter.makeDropShadow(dx, dy, sigmaX, sigmaY, argb, inputPtr) as number
    return new ImageFilter(new ImageFilterPtr(ptr))
  }

  static makeDropShadowOnly(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    argb: number,
    input?: ImageFilter
  ): ImageFilter {
    const inputPtr = input ? input.raw : 0
    const ptr = CanvasKitApi.ImageFilter.makeDropShadowOnly(dx, dy, sigmaX, sigmaY, argb, inputPtr) as number
    return new ImageFilter(new ImageFilterPtr(ptr))
  }
}
