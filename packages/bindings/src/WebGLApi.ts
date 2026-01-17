import invariant from 'invariant'

import type { Ptr } from './types'
import { CanvasKitApi } from './CanvasKitApi'

export type WebGLContextId = number

export type WebGLContextState = {
  id: WebGLContextId
  handle: number
  selector: string
  webgl2: boolean
  width: number
  height: number
  sampleCount: number
  stencilBits: number
  surface: Ptr
  grContext: Ptr
}

export type WebGLContextOptions = {
  selector: string
  webgl2?: boolean
  width?: number
  height?: number
  sampleCount?: number
  stencilBits?: number
}

export type WebGLApiDeps = {
  webgl: {
    hasWebGL(): boolean
    hasExport?(name: string): boolean
    createContext(ptr: number, byteLength: number, webgl2: boolean): number
    makeContextCurrent(ctx: number): number
    destroyContext(ctx: number): number
    makeOnScreenSurface(w: number, h: number): Ptr
    makeOnScreenSurfaceEx(w: number, h: number, sampleCount: number, stencilBits: number): Ptr
    makeGrContext(): Ptr
    getSampleCount(): number
    getStencilBits(): number
  }
  surface: {
    delete(surface: Ptr): void
  }
  grContext: {
    releaseResourcesAndAbandonContext(context: Ptr): void
  }
  allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr
  free(ptr: Ptr): void
}

export class WebGLApi {
  #contexts = new Map<WebGLContextId, WebGLContextState>()
  #currentId: WebGLContextId | null = null
  #nextId = 1
  #encoder = new TextEncoder()
  #deps: WebGLApiDeps

  constructor(deps?: Partial<WebGLApiDeps>) {
    this.#deps = {
      webgl: deps?.webgl ?? CanvasKitApi.WebGL,
      surface: deps?.surface ?? CanvasKitApi.Surface,
      grContext: deps?.grContext ?? CanvasKitApi.GrContext,
      allocBytes: deps?.allocBytes ?? CanvasKitApi.allocBytes,
      free: deps?.free ?? CanvasKitApi.free,
    }
  }

  hasWebGL(): boolean {
    return this.#deps.webgl.hasWebGL()
  }

  createContext(options: WebGLContextOptions): WebGLContextId {
    invariant(this.hasWebGL(), 'WebGL exports not available. Build with CHEAP_WEBGL=1')

    const selector = options.selector
    const webgl2 = options.webgl2 ?? true
    const width = options.width ?? this.#resolveCanvasWidth(selector)
    const height = options.height ?? this.#resolveCanvasHeight(selector)

    invariant(width > 0 && height > 0, 'Expected width/height > 0 for WebGL surface')

    const bytes = this.#encoder.encode(selector)
    const ptr = this.#deps.allocBytes(bytes)

    let handle = 0
    try {
      handle = this.#deps.webgl.createContext(ptr, bytes.length, webgl2)
    } finally {
      this.#deps.free(ptr)
    }

    if (!handle) {
      throw new Error('WebGL_CreateContext returned 0')
    }

    const ok = this.#deps.webgl.makeContextCurrent(handle)
    if (ok < 0) {
      throw new Error(`WebGL_MakeContextCurrent failed (code ${ok})`)
    }

    const sampleCount = options.sampleCount ?? this.#deps.webgl.getSampleCount()
    const stencilBits = options.stencilBits ?? this.#deps.webgl.getStencilBits()

    const grContext = this.#deps.webgl.makeGrContext()
    const surface = this.#createOnScreenSurface(width, height, sampleCount, stencilBits)

    const id = this.#nextId++
    const state: WebGLContextState = {
      id,
      handle,
      selector,
      webgl2,
      width,
      height,
      sampleCount,
      stencilBits,
      surface,
      grContext,
    }

    this.#contexts.set(id, state)
    this.#currentId = id

    return id
  }

  getContext(id: WebGLContextId): WebGLContextState | null {
    return this.#contexts.get(id) ?? null
  }

  listContexts(): WebGLContextState[] {
    return Array.from(this.#contexts.values())
  }

  makeContextCurrent(id: WebGLContextId): number {
    const state = this.#getState(id)
    const ok = this.#deps.webgl.makeContextCurrent(state.handle)
    if (ok >= 0) {
      this.#currentId = id
    }
    return ok
  }

  resizeSurface(id: WebGLContextId, width: number, height: number, sampleCount?: number, stencilBits?: number): Ptr {
    const state = this.#getState(id)
    invariant(width > 0 && height > 0, 'Expected width/height > 0 for WebGL surface')

    this.makeContextCurrent(id)
    this.#deps.surface.delete(state.surface)

    const nextSampleCount = sampleCount ?? state.sampleCount
    const nextStencilBits = stencilBits ?? state.stencilBits

    const surface = this.#createOnScreenSurface(width, height, nextSampleCount, nextStencilBits)

    state.width = width
    state.height = height
    state.sampleCount = nextSampleCount
    state.stencilBits = nextStencilBits
    state.surface = surface

    return surface
  }

  destroyContext(id: WebGLContextId): void {
    const state = this.#contexts.get(id)
    if (!state) return

    if (state.surface) {
      this.#deps.surface.delete(state.surface)
    }

    if (state.grContext) {
      this.#deps.grContext.releaseResourcesAndAbandonContext(state.grContext)
    }

    this.#deps.webgl.destroyContext(state.handle)
    this.#contexts.delete(id)

    if (this.#currentId === id) {
      this.#currentId = null
    }
  }

  destroyAll(): void {
    for (const id of Array.from(this.#contexts.keys())) {
      this.destroyContext(id)
    }
  }

  #getState(id: WebGLContextId): WebGLContextState {
    const state = this.#contexts.get(id)
    invariant(state != null, `Unknown WebGL context id: ${id}`)
    return state
  }

  #createOnScreenSurface(width: number, height: number, sampleCount: number, stencilBits: number): Ptr {
    const hasEx = typeof this.#deps.webgl.hasExport === 'function'
      ? this.#deps.webgl.hasExport('MakeOnScreenCanvasSurfaceEx')
      : true

    if (hasEx && sampleCount > 0 && stencilBits >= 0) {
      const surface = this.#deps.webgl.makeOnScreenSurfaceEx(width, height, sampleCount, stencilBits)
      if (surface) return surface
    }

    const surface = this.#deps.webgl.makeOnScreenSurface(width, height)
    if (!surface) {
      throw new Error('MakeOnScreenCanvasSurface returned 0')
    }
    return surface
  }

  #resolveCanvasWidth(selector: string): number {
    const canvas = this.#resolveCanvas(selector)
    return canvas ? canvas.width | 0 : 0
  }

  #resolveCanvasHeight(selector: string): number {
    const canvas = this.#resolveCanvas(selector)
    return canvas ? canvas.height | 0 : 0
  }

  #resolveCanvas(selector: string): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null
    const el = document.querySelector(selector)
    if (!el) return null
    if (el instanceof HTMLCanvasElement) return el
    return null
  }
}
