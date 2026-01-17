import { Api } from './Api'
import type { Ptr } from '../types'

export class WebGLApi extends Api {
  hasWebGL(): boolean {
    return this.hasExport('WebGL_CreateContext') && this.hasExport('WebGL_MakeContextCurrent')
  }

  createContext(selectorUtf8Ptr: number, byteLength: number, webgl2: boolean): number {
    return (
      this.invoke('WebGL_CreateContext', selectorUtf8Ptr >>> 0, byteLength | 0, webgl2 ? 1 : 0) as number
    ) | 0
  }

  makeContextCurrent(ctx: number): number {
    return (this.invoke('WebGL_MakeContextCurrent', ctx | 0) as number) | 0
  }

  destroyContext(ctx: number): number {
    return (this.invoke('WebGL_DestroyContext', ctx | 0) as number) | 0
  }

  makeOnScreenSurface(w: number, h: number): Ptr {
    return ((this.invoke('MakeOnScreenCanvasSurface', w | 0, h | 0) as number) ?? 0) >>> 0
  }

  makeOnScreenSurfaceEx(w: number, h: number, sampleCount: number, stencilBits: number): Ptr {
    return (
      (this.invoke('MakeOnScreenCanvasSurfaceEx', w | 0, h | 0, sampleCount | 0, stencilBits | 0) as number) ?? 0
    ) >>> 0
  }

  makeGrContext(): Ptr {
    return ((this.invoke('MakeGrContextWebGL') as number) ?? 0) >>> 0
  }

  getSampleCount(): number {
    return (this.invoke('WebGL_GetSampleCount') as number) | 0
  }

  getStencilBits(): number {
    return (this.invoke('WebGL_GetStencilBits') as number) | 0
  }

  getLastError(): number {
    if (!this.hasExport('WebGL_GetLastError')) return 0
    return (this.invoke('WebGL_GetLastError') as number) | 0
  }

  makeRenderTarget(w: number, h: number): Ptr {
    if (!this.hasExport('MakeRenderTarget')) return 0
    return ((this.invoke('MakeRenderTarget', w | 0, h | 0) as number) ?? 0) >>> 0
  }

  makeRenderTargetSurface(w: number, h: number): Ptr {
    if (!this.hasExport('MakeRenderTargetSurface')) return 0
    return ((this.invoke('MakeRenderTargetSurface', w | 0, h | 0) as number) ?? 0) >>> 0
  }
}
