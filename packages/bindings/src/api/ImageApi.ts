import type { Ptr } from '../types'
import type { AlphaType, ColorType, TileMode, FilterMode, MipmapMode } from '../enums'
import { Api } from './Api'

export class ImageApi extends Api {
  makeFromEncoded(bytesPtr: Ptr, size: number): Ptr {
    return this.invoke('MakeImageFromEncoded', bytesPtr >>> 0, size | 0)
  }

  makeFromRGBA8888(pixelsPtr: Ptr, width: number, height: number): Ptr {
    return this.invoke('MakeImageFromRGBA8888', pixelsPtr >>> 0, width | 0, height | 0) as Ptr
  }

  delete(image: Ptr): void {
    this.invoke('DeleteImage', image)
  }

  width(image: Ptr): number {
    return this.invoke('Image_width', image)
  }

  height(image: Ptr): number {
    return this.invoke('Image_height', image)
  }

  alphaType(image: Ptr): AlphaType {
    return this.invoke('Image_alphaType', image) as AlphaType
  }

  colorType(image: Ptr): ColorType {
    return this.invoke('Image_colorType', image) as ColorType
  }

  makeShader(
    image: Ptr,
    tileModeX: TileMode,
    tileModeY: TileMode,
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    matrixPtr: Ptr
  ): Ptr {
    return this.invoke(
      'Image_makeShader',
      image >>> 0,
      tileModeX | 0,
      tileModeY | 0,
      filterMode | 0,
      mipmapMode | 0,
      matrixPtr >>> 0
    ) as Ptr
  }

  readPixelsRgba8888(image: Ptr, x: number, y: number, w: number, h: number, dst: Ptr, dstRowBytes: number): number {
    return this.invoke('Image_readPixelsRGBA8888', image, x | 0, y | 0, w | 0, h | 0, dst >>> 0, dstRowBytes | 0)
  }

  encodeToPng(image: Ptr): Ptr {
    return this.invoke('Image_encodeToPNG', image)
  }
}
