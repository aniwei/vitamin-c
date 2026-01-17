import { Api } from './Api'
import type { Ptr } from '../types'

export class WebGPUApi extends Api {
  hasWebGPU(): boolean {
    return this.hasExport('MakeGPUTextureSurface')
  }

  makeGPUTextureSurface(textureHandle: number, textureFormat: number, width: number, height: number): Ptr {
    return (
      (this.invoke(
        'MakeGPUTextureSurface',
        textureHandle >>> 0,
        textureFormat >>> 0,
        width | 0,
        height | 0,
      ) as number) ?? 0
    ) >>> 0
  }

  replaceBackendTexture(
    surface: Ptr,
    textureHandle: number,
    textureFormat: number,
    width: number,
    height: number,
  ): boolean {
    return (
      this.invoke(
        'Surface_replaceBackendTexture',
        surface >>> 0,
        textureHandle >>> 0,
        textureFormat >>> 0,
        width | 0,
        height | 0,
      ) as number
    ) !== 0
  }

  makeGrContext(): Ptr {
    return ((this.invoke('MakeGrContext') as number) ?? 0) >>> 0
  }
}
