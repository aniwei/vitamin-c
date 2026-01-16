import invariant from 'invariant'

import type { Imports } from './types'
import { WasmApi } from './WasmApi'

export interface EnumWasmOptions {
  uri?: string
  path?: string
  imports?: Imports
}

async function createEnumApi(input: string, imports?: Imports): Promise<WasmApi> {
  const wasmApi = new WasmApi()
  await wasmApi.run(input, { imports }, 0)
  return wasmApi
}

export class EnumApi {
  static async ready(options: EnumWasmOptions): Promise<WasmApi> {
    if (this.#api !== null) {
      return this.#api
    }

    const input = options.uri ?? options.path
    if (!input) {
      throw new Error('Expected options.uri or options.path')
    }

    const api = await createEnumApi(input, options.imports)
    this.#api = api

    return api
  }

  static #api: WasmApi | null = null

  static invoke(name: string, ...args: any[]): any {
    invariant(this.#api !== null, 'EnumApi not initialized. Call EnumApi.ready() first.')
    return this.#api.invoke(name, ...args)
  }

  static hasExport(name: string): boolean {
    invariant(this.#api !== null, 'EnumApi not initialized. Call EnumApi.ready() first.')
    return this.#api.hasExport(name)
  }
}
