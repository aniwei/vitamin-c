import wasmUrl from '../native/canvaskit_cheap.wasm?url'
import { CanvasKitApi } from '../src/index'

export async function loadCanvasKit() {
  await CanvasKitApi.ready({ uri: wasmUrl })
}
