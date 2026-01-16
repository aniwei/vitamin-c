import invariant from 'invariant'
import type { Ptr } from './types'

function isNodeLike(): boolean {
  return typeof process !== 'undefined' && !!(process as any).versions?.node
}

function isProbablyUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || (typeof window !== 'undefined' && input.startsWith('/'))
}

export class WasmApi {
  #exports: Map<string, any> = new Map()
  #runner: any

  #getHeapU8: (() => Uint8Array) | null = null
  #memoryRef: any = null

  get exports() {
    return this.#exports
  }

  get runner() {
    invariant(this.#runner != null, 'Wasm runner is not initialized.')
    return this.#runner
  }

  get getHeapU8() {
    invariant(this.#getHeapU8 !== null, 'Wasm getHeapU8 is not initialized.')
    return this.#getHeapU8
  }

  get memoryRef() {
    invariant(this.#memoryRef !== null, 'Wasm MemoryRef is not initialized.')
    return this.#memoryRef
  }

  #heapU8(): Uint8Array {
    return this.getHeapU8()
  }

  #heapU32(): Uint32Array {
    return new Uint32Array(this.#heapU8().buffer)
  }

  #heapF32(): Float32Array {
    return new Float32Array(this.#heapU8().buffer)
  }

  // MDN DataView-style APIs
  getUint8(byteOffset: Ptr): number {
    return this.#heapU8()[byteOffset >>> 0] >>> 0
  }

  setUint8(byteOffset: Ptr, value: number): void {
    this.#heapU8()[byteOffset >>> 0] = value & 0xff
  }

  getUint32(byteOffset: Ptr, littleEndian: boolean = true): number {
    const dv = new DataView(this.#heapU8().buffer)
    return dv.getUint32(byteOffset >>> 0, littleEndian) >>> 0
  }

  setUint32(byteOffset: Ptr, value: number, littleEndian: boolean = true): void {
    const dv = new DataView(this.#heapU8().buffer)
    dv.setUint32(byteOffset >>> 0, value >>> 0, littleEndian)
  }

  getFloat32(byteOffset: Ptr, littleEndian: boolean = true): number {
    const dv = new DataView(this.#heapU8().buffer)
    return dv.getFloat32(byteOffset >>> 0, littleEndian)
  }

  setFloat32(byteOffset: Ptr, value: number, littleEndian: boolean = true): void {
    const dv = new DataView(this.#heapU8().buffer)
    dv.setFloat32(byteOffset >>> 0, +value, littleEndian)
  }

  getBytes(byteOffset: Ptr, length: number): Uint8Array {
    return this.#heapU8().subarray(byteOffset >>> 0, ((byteOffset >>> 0) + (length >>> 0)) >>> 0)
  }

  setBytes(byteOffset: Ptr, bytes: ArrayLike<number> | Uint8Array): void {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayLike<number>)
    this.#heapU8().set(u8, byteOffset >>> 0)
  }

  getUint32Array(byteOffset: Ptr, length: number): Uint32Array {
    return new Uint32Array(this.#heapU8().buffer, byteOffset >>> 0, length >>> 0)
  }

  setUint32Array(byteOffset: Ptr, values: ArrayLike<number> | Uint32Array): void {
    if (values instanceof Uint32Array) {
      if (!values.length) return
      this.#heapU32().set(values, (byteOffset >>> 0) >>> 2)
      return
    }

    const len = values.length >>> 0
    if (!len) return
    const u32 = this.#heapU32()
    const off = (byteOffset >>> 0) >>> 2
    for (let i = 0; i < len; i++) {
      u32[off + i] = (values[i]! >>> 0) as number
    }
  }

  getFloat32Array(byteOffset: Ptr, length: number): Float32Array {
    return new Float32Array(this.#heapU8().buffer, byteOffset >>> 0, length >>> 0)
  }

  setFloat32Array(byteOffset: Ptr, values: ArrayLike<number> | Float32Array): void {
    if (values instanceof Float32Array) {
      if (!values.length) return
      this.#heapF32().set(values, (byteOffset >>> 0) >>> 2)
      return
    }

    const len = values.length >>> 0
    if (!len) return
    const f32 = this.#heapF32()
    const off = (byteOffset >>> 0) >>> 2
    for (let i = 0; i < len; i++) {
      f32[off + i] = +values[i]!
    }
  }

  alloc(bytes: Uint8Array): Ptr
  alloc(bytes: number | Uint8Array): Ptr {
    const size = typeof bytes === 'number' ? (bytes | 0) : bytes.length
    const ptr = this.malloc(size)
    if (ptr === 0) {
      throw new Error(`Wasm malloc failed to allocate ${size} bytes`)
    }

    if (bytes instanceof Uint8Array) {
      this.setBytes(ptr, bytes)
    }

    return ptr
  }

  allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayLike<number>)
    return this.alloc(u8)
  }

  malloc(size: number): Ptr {
    return this.invoke('malloc', size | 0) as number
  }

  free(ptr: Ptr): void {
    this.invoke('free', ptr >>> 0)
  }

  hasExport(name: string): boolean {
    return this.resolve(name) !== null
  }

  invoke(name: string, ...args: any[]): any {
    const fn = this.resolve(name)
    if (!fn) {
      throw new Error(`Wasm export not found: ${name}`)
    }
    return fn(...args)
  }

  resolve(name: string) {
    if (this.#exports.has(name)) {
      return this.#exports.get(name) ?? null
    }

    const asm = this.runner.asm as any
    if (!asm) {
      this.#exports.set(name, null)
      return null
    }

    if (typeof asm[name] === 'function') {
      this.#exports.set(name, asm[name])
      return asm[name]
    }

    const underscored = `_${name}`
    if (typeof asm[underscored] === 'function') {
      this.#exports.set(name, asm[underscored])
      return asm[underscored]
    }

    this.#exports.set(name, null)
    return null
  }

  attach(runner: any): void {
    const mem = this
    const imports: Record<string, any> = (runner as any).imports ?? ((runner as any).imports = {})
    const baseEnv: Record<string, any> = imports.env ?? {}

    // Emscripten often calls into these during startup or when hitting fatal errors.
    // In a no-glue runtime, surfacing the message avoids opaque `RuntimeError: unreachable`.
    const readCString = (ptr: number) => {
      try {
        const memory = (imports.env as any)?.memory
        if (!(memory instanceof WebAssembly.Memory)) return ''
        const u8 = new Uint8Array(memory.buffer)
        let end = ptr >>> 0
        while (end < u8.length && u8[end] !== 0) end++
        return new TextDecoder('utf-8').decode(u8.subarray(ptr >>> 0, end))
      } catch {
        return ''
      }
    }

    baseEnv.abort = function abort(message?: number | string, file?: number, line?: number, func?: number) {
      const msg = typeof message === 'number' ? readCString(message) : String(message ?? '')
      const fileStr = typeof file === 'number' ? readCString(file) : ''
      const funcStr = typeof func === 'number' ? readCString(func) : ''
      const details = [msg, fileStr, line != null ? String(line) : '', funcStr].filter(Boolean).join(' ')
      throw new Error(`Emscripten abort${details ? `: ${details}` : ''}`)
    }

    baseEnv.emscripten_abort = function emscripten_abort(message?: number | string, file?: number, line?: number, func?: number) {
      const msg = typeof message === 'number' ? readCString(message) : String(message ?? '')
      const fileStr = typeof file === 'number' ? readCString(file) : ''
      const funcStr = typeof func === 'number' ? readCString(func) : ''
      const details = [msg, fileStr, line != null ? String(line) : '', funcStr].filter(Boolean).join(' ')
      throw new Error(`emscripten_abort${details ? `: ${details}` : ''}`)
    }

    baseEnv.__assert_fail = function __assert_fail(assertion: number, file: number, line: number, func: number) {
      const assertionStr = readCString(assertion)
      const fileStr = readCString(file)
      const funcStr = readCString(func)
      throw new Error(`__assert_fail: ${assertionStr} ${fileStr}:${line} ${funcStr}`)
    }

    // Allow memory growth: when Emscripten is built with ALLOW_MEMORY_GROWTH it may call
    // emscripten_resize_heap / emscripten_notify_memory_growth.
    if (typeof baseEnv.emscripten_notify_memory_growth !== 'function') {
      baseEnv.emscripten_notify_memory_growth = function emscripten_notify_memory_growth(_memoryIndex: number) {
        // no-op; JS-side views should read memory.buffer dynamically.
      }
    }

    if (typeof baseEnv.emscripten_resize_heap !== 'function') {
      baseEnv.emscripten_resize_heap = function emscripten_resize_heap(requestedSize: number) {
        try {
          const memory = (imports.env as any)?.memory
          if (!(memory instanceof WebAssembly.Memory)) return 0
          const pageSize = 65536
          const curBytes = (memory.buffer.byteLength >>> 0) as number
          const reqBytes = requestedSize >>> 0
          if (reqBytes <= curBytes) return 1
          const deltaPages = (((reqBytes - curBytes + pageSize - 1) / pageSize) | 0) >>> 0
          memory.grow(deltaPages)
          return 1
        } catch {
          return 0
        }
      }
    }

    if (typeof baseEnv.emscripten_get_now !== 'function') {
      baseEnv.emscripten_get_now = function emscripten_get_now() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      }
    }

    // WASI fd_* stubs: return ENOSYS and zero out out-params to avoid uninitialized reads.
    const wasiMemory = baseEnv.memory as WebAssembly.Memory | undefined
    const writeI32 = (ptr: number, value: number) => {
      if (!wasiMemory || !ptr) return
      new DataView(wasiMemory.buffer).setInt32(ptr >>> 0, value | 0, true)
    }
    const writeI64 = (ptr: number, value: bigint) => {
      if (!wasiMemory || !ptr) return
      new DataView(wasiMemory.buffer).setBigInt64(ptr >>> 0, value, true)
    }
    const ENOSYS = 52

    baseEnv.fd_close = function fd_close(_fd: number) {
      return ENOSYS
    }
    baseEnv.fd_read = function fd_read(_fd: number, _iovs: number, _iovsLen: number, nread: number) {
      writeI32(nread, 0)
      return ENOSYS
    }
    baseEnv.fd_write = function fd_write(_fd: number, _iovs: number, _iovsLen: number, nwritten: number) {
      writeI32(nwritten, 0)
      return ENOSYS
    }
    baseEnv.fd_seek = function fd_seek(_fd: number, _offset: bigint, _whence: number, newOffset: number) {
      writeI64(newOffset, 0n)
      return ENOSYS
    }
  
    
    if (typeof baseEnv.malloc_usable_size !== 'function') {
      baseEnv.malloc_usable_size = function malloc_usable_size(_ptr: number) {
        // 在自定义分配器下未知；返回 0 表示“未知/不可用”。
        return 0
      }
    }
  
    if (typeof baseEnv._emscripten_throw_longjmp !== 'function') {
      baseEnv._emscripten_throw_longjmp = function _emscripten_throw_longjmp(...args: any[]) {
        const err: any = new Error('emscripten longjmp')
        err.name = 'EmscriptenLongjmp'
        err.args = args
        throw err
      }
    }
  
    imports.env = new Proxy(baseEnv, {
      get(target, prop) {
        if (prop in target) return (target as any)[prop]
        if (prop === Symbol.toStringTag) return undefined
  
        // Emscripten MAIN_MODULE 构建可能会导入 invoke_* 辅助函数。
        // 这些是对间接函数表调用的包装。
        if (typeof prop === 'string' && prop.startsWith('invoke_')) {
          return function emscriptenInvokeWrapper(...args: any[]) {
            const fnPtr = args[0] | 0
            const table: WebAssembly.Table | undefined = (imports.env as any)?.__indirect_function_table
  
            if (!table) {
              throw new Error('Missing env.__indirect_function_table (required by invoke_*)')
            }
  
            const fn = table.get(fnPtr)
            if (typeof fn !== 'function') {
              throw new Error(`invoke_* target is not a function: ${fnPtr}`)
            }
            
            return (fn as any)(...args.slice(1))
          }
        }
  
        return function stubbedEnvImport() {
          let strict = false
          try {
            strict = !!(globalThis as any).__CK_STRICT_IMPORTS
          } catch {
            strict = false
          }

          if (strict) {
            throw new Error(`Missing env import: ${String(prop)}`)
          }
          return 0
        }
      },

      set(target, prop, value) {
        (target as any)[prop] = value
        return true
      }
    })
  
    // Emscripten MAIN_MODULE 构建可能通过 GOT.mem 导入栈边界。
    const gotMem: Record<string, any> = {
      __stack_low: new WebAssembly.Global({ value: 'i32', mutable: true }, 0),
      __stack_high: new WebAssembly.Global({ value: 'i32', mutable: true }, 0x7fffffff),
    }
  
    imports['GOT.mem'] = new Proxy(gotMem, {
      get(target, prop) {
        if (prop in target) {
          return (target as any)[prop]
        }
        if (prop === Symbol.toStringTag) {
          return undefined
        }

        const g = new WebAssembly.Global({ value: 'i32', mutable: true }, 0)
        ;(target as any)[prop] = g
        return g
      },
    })
  
    // Emscripten MAIN_MODULE 构建可能通过 GOT.func 导入函数指针全局变量。
    // 这里用 i32 mutable global 作为占位，满足 instantiate 的类型要求。
    const gotFunc: Record<string, any> = {}
    imports['GOT.func'] = new Proxy(gotFunc, {
      get(target, prop) {
        if (prop in target) {
          return (target as any)[prop]
        }
        if (prop === Symbol.toStringTag) {
          return undefined
        }

        const g = new WebAssembly.Global({ value: 'i32', mutable: true }, 0)
        ;(target as any)[prop] = g
        return g
      },
    })
  
    const wasi: Record<string, any> = { ...(imports.wasi_snapshot_preview1 ?? {}) }
  
    // 为 Emscripten + musl 提供的最小 WASI 填充，适用于我们的无 glue 设置。
    // 仅实现启动和日志记录期间常用的子集。
    if (typeof wasi.proc_exit !== 'function') {
      wasi.proc_exit = function proc_exit(exitCode: number) {
        const err: any = new Error(`wasi proc_exit(${exitCode | 0})`)
        err.name = 'WasiProcExit'
        err.exitCode = exitCode | 0
        throw err
      }
    }
  
    if (typeof wasi.environ_sizes_get !== 'function') {
      wasi.environ_sizes_get = function environ_sizes_get(environCountPtr: number, environBufSizePtr: number) {
        // int* environCount, int* environBufSize
        mem.setUint32(environCountPtr >>> 0, 0, true)
        mem.setUint32(environBufSizePtr >>> 0, 0, true)
        return 0
      }
    }
  
    if (typeof wasi.environ_get !== 'function') {
      wasi.environ_get = function environ_get(_environPtr: number, _environBufPtr: number) {
        return 0
      }
    }
  
    if (typeof wasi.fd_write !== 'function') {
      wasi.fd_write = function fd_write(fd: number, iovs: number, iovsLen: number, nwrittenPtr: number) {
        let written = 0
        let text = ''

        for (let i = 0; i < (iovsLen | 0); i++) {
          const base = (iovs + i * 8) >>> 0
          const ptr = mem.getUint32((base + 0) >>> 0, true) >>> 0
          const len = mem.getUint32((base + 4) >>> 0, true) >>> 0
          if (!len) continue
          written += len
          try {
            const bytes = mem.getBytes(ptr, len)
            text += new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          } catch {
            // ignore
          }
        }

        // Best-effort: forward WASI stdout/stderr to console.
        if (text) {
          if ((fd | 0) === 2) console.error(text)
          else console.log(text)
        }

        mem.setUint32(nwrittenPtr >>> 0, written >>> 0, true)
        return 0
      }
    }
  
    if (typeof wasi.fd_close !== 'function') {
      wasi.fd_close = function fd_close(_fd: number) {
        return 0
      }
    }
  
    if (typeof wasi.fd_read !== 'function') {
      wasi.fd_read = function fd_read(_fd: number, _iovs: number, _iovsLen: number, nwrittenPtr: number) {
        mem.setUint32(nwrittenPtr >>> 0, 0, true)
        return 8 // EBADF
      }
    }

    if (typeof wasi.clock_time_get !== 'function') {
      wasi.clock_time_get = function clock_time_get(_clockId: number, _precision: number, timePtr: number) {
        // Write u64 nanoseconds since epoch.
        const ns = BigInt(Date.now()) * 1_000_000n
        const lo = Number(ns & 0xffff_ffffn) >>> 0
        const hi = Number((ns >> 32n) & 0xffff_ffffn) >>> 0
        mem.setUint32((timePtr >>> 0) + 0, lo, true)
        mem.setUint32((timePtr >>> 0) + 4, hi, true)
        return 0
      }
    }
  
    if (typeof wasi.fd_seek !== 'function') {
      wasi.fd_seek = function fd_seek(_fd: number, _offsetLo: number, _offsetHi: number, _whence: number, newOffsetPtr: number) {
        mem.setUint32((newOffsetPtr >>> 0) + 0, 0, true)
        mem.setUint32((newOffsetPtr >>> 0) + 4, 0, true)
        return 8 // EBADF
      }
    }
  
    if (typeof wasi.fd_pread !== 'function') {
      wasi.fd_pread = function fd_pread(_fd: number, _iovs: number, _iovsLen: number, _offsetLo: number, _offsetHi: number, nwrittenPtr: number) {
        mem.setUint32(nwrittenPtr >>> 0, 0, true)
        return 8 // EBADF
      }
    }
  
    imports.wasi_snapshot_preview1 = new Proxy(wasi, {
      get(target, prop) {
        if (prop in target) return (target as any)[prop]
        if (prop === Symbol.toStringTag) return undefined
        return function stubbedWasiImport() {
          return 52 // ENOSYS
        }
      },
    })
  }

  async load(input: string): Promise<Uint8Array> {
    if (!isNodeLike() || isProbablyUrl(input)) {
      const url = typeof window !== 'undefined' ? new URL(input, window.location.href).toString() : input
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`createCanvasKit: failed to fetch wasm: ${url} (${res.status})`)
      }

      return new Uint8Array(await res.arrayBuffer())
    }

    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const uri = path.resolve(process.cwd(), input)
    const buf = await fs.readFile(uri)

    return new Uint8Array(buf)
  }

  async run(input: string, opts: any = {}, stackSize: number = 0): Promise<void> {
    const wasmBytes = await this.load(input)
    const wasmSource = new Uint8Array(wasmBytes)

    // In Node-like environments (including Vitest), prefer Node's resolver so we
    // don't accidentally load browser entrypoints via bundler resolution.
    let cheap: any
    let internal: any
    if (isNodeLike()) {
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)
      cheap = require('@libmedia/cheap')
      internal = require('@libmedia/cheap/internal')
    } else {
      cheap = await import('@libmedia/cheap')
      internal = await import('@libmedia/cheap/internal')
    }

    const resource = await cheap.compileResource({ source: wasmSource })

    // Vitest executes tests in worker_threads by default (isMainThread=false).
    // In that case cheap skips auto-init and expects the caller to initialize.
    // `initThread()` requires an external stackPointer (normally provided by a parent),
    // so for our single-threaded Node/Vitest usage we explicitly call `initMain()`.
    if (isNodeLike() && !internal.Allocator) {
      try {
        const { createRequire } = await import('node:module')
        const require = createRequire(import.meta.url)
        const path = require('node:path') as typeof import('node:path')
        const cheapEntry = require.resolve('@libmedia/cheap')
        const heapPath = path.resolve(path.dirname(cheapEntry), 'heap.cjs')
        const heap = require(heapPath)
        if (typeof heap.initMain === 'function') {
          heap.initMain()
        }
      } catch {
        // ignore; we'll throw a clearer error below if Allocator is still null
      }
    }

    if (!internal.Allocator) {
      let isMainThread: boolean | undefined
      try {
        isMainThread = (await import('node:worker_threads')).isMainThread
      } catch {
        // ignore
      }
      throw new Error(
        `@libmedia/cheap heap not initialized (Allocator=null). ` +
          `isNodeLike=${isNodeLike()} isMainThread=${String(isMainThread)} cheap.isMainThread=${String(cheap?.isMainThread)}`
      )
    }

    const runner = new cheap.WebAssemblyRunner(resource, { imports: opts.imports ?? {} })

    const skipInit = (() => {
      try {
        return process?.env?.CK_SKIP_WASM_INIT === '1'
      } catch {
        return false
      }
    })()
    if (skipInit && Array.isArray((runner as any).resource?.initFuncs)) {
      ;(runner as any).resource.initFuncs = []
    }

    this.#getHeapU8 = internal.getHeapU8
    this.#memoryRef = cheap.Memory
    this.#runner = runner

    const zeroMemory = (() => {
      try {
        return process?.env?.CK_ZERO_MEMORY === '1'
      } catch {
        return false
      }
    })()
    if (zeroMemory) {
      try {
        const mem = (runner as any).imports?.env?.memory
        if (mem instanceof WebAssembly.Memory) {
          new Uint8Array(mem.buffer).fill(0)
        }
      } catch {
        // ignore
      }
    }
    
    // attach 必须在 runner.run() 之前调用，因为 run() 会进行 WebAssembly.instantiate
    // 此时需要 GOT.mem、GOT.func、WebGL 等导入已经准备好
    this.attach(runner)

    // cheap 的 WebAssemblyRunner 会在 instantiate 后立刻调用 initRunTime()，执行 wasm 的 initFuncs
    //（通常包含 _initialize / __wasm_call_ctors）。
    // 对于 Emscripten 产物，JS glue 通常会在 ctors 前完成 stack 初始化：
    // - emscripten_stack_init()
    // - __set_stack_limits(emscripten_stack_get_base(), emscripten_stack_get_end())
    // 我们是 no-glue runtime，需要在这里补齐，否则 stack 边界 globals 仍为 0，
    // 任意栈检查都会触发 `unreachable`。
    const originalInitRunTime = (runner as any).initRunTime?.bind(runner)
    if (typeof originalInitRunTime === 'function') {
      ;(runner as any).initRunTime = () => {
        const asm: any = (runner as any).asm

        let debug = false
        try {
          debug = !!(globalThis as any).__CK_GL_DEBUG
        } catch {
          debug = false
        }

        // 1) 初始化 stack base/end 常量（由链接器写入 wasm）。
        try {
          if (debug) {
            console.log('ck:stack init present:', {
              emscripten_stack_init: typeof asm?.emscripten_stack_init === 'function',
              _emscripten_stack_init: typeof asm?._emscripten_stack_init === 'function',
            })
          }

          if (typeof asm?.emscripten_stack_init === 'function') {
            asm.emscripten_stack_init()
          } else if (typeof asm?._emscripten_stack_init === 'function') {
            asm._emscripten_stack_init()
          }
        } catch (e) {
          // ignore and continue; we'll fail later with a clearer error
          console.warn('emscripten_stack_init failed:', e)
        }

        // 2) 将 stack limits 写入 wasm 内部 globals，用于栈溢出检查。
        try {
          const getBase = asm?.emscripten_stack_get_base ?? asm?._emscripten_stack_get_base
          const getEnd = asm?.emscripten_stack_get_end ?? asm?._emscripten_stack_get_end
          const setLimits = asm?.__set_stack_limits

          if (typeof getBase === 'function' && typeof getEnd === 'function' && typeof setLimits === 'function') {
            const base = (getBase() >>> 0) as number
            const end = (getEnd() >>> 0) as number

            if (debug) {
              console.log('ck:stack base/end:', { base, end, ok: base !== 0 && end !== 0 && base > end })
            }

            // base 应该 > end（stack 向下增长）；任何为 0 都说明 init 失败。
            if (base !== 0 && end !== 0) {
              setLimits(base, end)

              // Sanity check: stack_restore 会做边界检查，若 limits 仍为 0 会直接 trap。
              if (debug) {
                const getCur = asm?.emscripten_stack_get_current
                const restore = asm?._emscripten_stack_restore
                if (typeof getCur === 'function' && typeof restore === 'function') {
                  const cur = (getCur() >>> 0) as number
                  try {
                    restore(cur)
                    console.log('ck:stack limits check: ok')
                  } catch (e) {
                    console.error('ck:stack limits check: failed', e)
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('__set_stack_limits failed:', e)
        }

        return originalInitRunTime()
      }
    }
    
    await this.runner.run(opts, stackSize)

    if (skipInit && this.hasExport('Cheap_Init')) {
      try {
        this.invoke('Cheap_Init')
      } catch {
        // ignore: best-effort init only
      }
    }
  }
}
