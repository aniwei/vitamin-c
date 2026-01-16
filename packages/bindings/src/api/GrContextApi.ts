import { Api } from './Api'
import type { Ptr } from '../types'

export class GrContextApi extends Api {
  getCurrent(): Ptr {
    return ((this.invoke('GetCurrentGrContext') as number) ?? 0) >>> 0
  }

  flush(context: Ptr): void {
    this.invoke('GrContext_flush', context >>> 0)
  }

  submit(context: Ptr, syncCpu: boolean = false): void {
    this.invoke('GrContext_submit', context >>> 0, syncCpu ? 1 : 0)
  }

  flushAndSubmit(context: Ptr, syncCpu: boolean = false): void {
    this.invoke('GrContext_flushAndSubmit', context >>> 0, syncCpu ? 1 : 0)
  }

  getResourceCacheLimitBytes(context: Ptr): number {
    return (this.invoke('GrContext_getResourceCacheLimitBytes', context >>> 0) as number) >>> 0
  }

  getResourceCacheUsageBytes(context: Ptr): number {
    return (this.invoke('GrContext_getResourceCacheUsageBytes', context >>> 0) as number) >>> 0
  }

  setResourceCacheLimitBytes(context: Ptr, maxResourceBytes: number): void {
    this.invoke('GrContext_setResourceCacheLimitBytes', context >>> 0, maxResourceBytes >>> 0)
  }

  releaseResourcesAndAbandonContext(context: Ptr): void {
    this.invoke('GrContext_releaseResourcesAndAbandonContext', context >>> 0)
  }

  freeGpuResources(context: Ptr): void {
    this.invoke('GrContext_freeGpuResources', context >>> 0)
  }

  performDeferredCleanup(context: Ptr, msNotUsed: number): void {
    this.invoke('GrContext_performDeferredCleanup', context >>> 0, msNotUsed | 0)
  }
}
