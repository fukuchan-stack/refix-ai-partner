import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // @ts-ignore
    monacoEditorPlugin.default({})
  ],
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})