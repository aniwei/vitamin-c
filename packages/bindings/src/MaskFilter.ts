import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import type { BlurStyle } from './enums'

class MaskFilterPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.MaskFilter.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): MaskFilterPtr {
    return new MaskFilterPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof MaskFilterPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }
}

export class MaskFilter extends ManagedObj {
  static makeBlur(style: BlurStyle, sigma: number): MaskFilter {
    const ptr = CanvasKitApi.MaskFilter.makeBlur(style, sigma) as number
    return new MaskFilter(new MaskFilterPtr(ptr))
  }
}
