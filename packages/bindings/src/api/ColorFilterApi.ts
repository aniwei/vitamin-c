import { Api } from './Api'
import type { Ptr } from '../types'

export class ColorFilterApi extends Api {
  delete(filter: Ptr): void {
    this.invoke('DeleteColorFilter', filter >>> 0)
  }

  makeBlend(argb: number, blendMode: number): Ptr {
    return this.invoke('MakeBlendColorFilter', argb >>> 0, blendMode | 0) as Ptr
  }

  makeMatrix(matrixPtr: Ptr): Ptr {
    return this.invoke('MakeMatrixColorFilter', matrixPtr >>> 0) as Ptr
  }

  makeCompose(outer: Ptr, inner: Ptr): Ptr {
    return this.invoke('MakeComposeColorFilter', outer >>> 0, inner >>> 0) as Ptr
  }

  makeLerp(t: number, dst: Ptr, src: Ptr): Ptr {
    return this.invoke('MakeLerpColorFilter', +t, dst >>> 0, src >>> 0) as Ptr
  }

  makeSRGBToLinearGamma(): Ptr {
    return this.invoke('MakeSRGBToLinearGammaColorFilter') as Ptr
  }

  makeLinearToSRGBGamma(): Ptr {
    return this.invoke('MakeLinearToSRGBGammaColorFilter') as Ptr
  }
}
