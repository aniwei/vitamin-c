import type { Ptr } from '../types'
import { Api } from './Api'

export class PathEffectApi extends Api {
  delete(pathEffect: Ptr): void {
    this.invoke('DeletePathEffect', pathEffect >>> 0)
  }

  makeDash(intervalsPtr: Ptr, count: number, phase: number): Ptr {
    return this.invoke('MakeDashPathEffect', intervalsPtr >>> 0, count | 0, +phase) as Ptr
  }

  makeDiscrete(segLength: number, deviation: number, seed: number): Ptr {
    return this.invoke('MakeDiscretePathEffect', +segLength, +deviation, seed >>> 0) as Ptr
  }

  makeCorner(radius: number): Ptr {
    return this.invoke('MakeCornerPathEffect', +radius) as Ptr
  }

  makeCompose(outer: Ptr, inner: Ptr): Ptr {
    return this.invoke('MakeComposePathEffect', outer >>> 0, inner >>> 0) as Ptr
  }

  makeSum(first: Ptr, second: Ptr): Ptr {
    return this.invoke('MakeSumPathEffect', first >>> 0, second >>> 0) as Ptr
  }
}