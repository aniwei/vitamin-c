import { Api } from './Api'
import type { Ptr } from '../types'
import type { TileMode } from '../enums'

export class ImageFilterApi extends Api {
  delete(filter: Ptr): void {
    this.invoke('DeleteImageFilter', filter >>> 0)
  }

  makeBlur(sigmaX: number, sigmaY: number, tileMode: TileMode, input: Ptr = 0): Ptr {
    return this.invoke('MakeBlurImageFilter', +sigmaX, +sigmaY, tileMode | 0, input >>> 0) as Ptr
  }

  makeColorFilter(colorFilter: Ptr, input: Ptr = 0): Ptr {
    return this.invoke('MakeColorFilterImageFilter', colorFilter >>> 0, input >>> 0) as Ptr
  }

  makeCompose(outer: Ptr, inner: Ptr): Ptr {
    return this.invoke('MakeComposeImageFilter', outer >>> 0, inner >>> 0) as Ptr
  }

  makeDropShadow(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    argb: number,
    input: Ptr = 0
  ): Ptr {
    return this.invoke(
      'MakeDropShadowImageFilter',
      +dx,
      +dy,
      +sigmaX,
      +sigmaY,
      argb >>> 0,
      input >>> 0
    ) as Ptr
  }

  makeDropShadowOnly(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    argb: number,
    input: Ptr = 0
  ): Ptr {
    return this.invoke(
      'MakeDropShadowOnlyImageFilter',
      +dx,
      +dy,
      +sigmaX,
      +sigmaY,
      argb >>> 0,
      input >>> 0
    ) as Ptr
  }
}
