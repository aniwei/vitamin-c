import { Api } from './Api'
import type { Ptr } from '../types'
import type { BlurStyle } from '../enums'

export class MaskFilterApi extends Api {
  delete(filter: Ptr): void {
    this.invoke('DeleteMaskFilter', filter >>> 0)
  }

  makeBlur(style: BlurStyle, sigma: number): Ptr {
    return this.invoke('MakeBlurMaskFilter', style | 0, +sigma) as Ptr
  }
}
