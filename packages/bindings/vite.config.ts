import { defineConfig } from 'vite'

export default defineConfig({
  root: 'examples',
  publicDir: false,
  build: {
    outDir: '../dist-examples',
    emptyOutDir: true,
  },
})
