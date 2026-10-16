import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { singleFile } from './scripts/single-file.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), singleFile()],
  base: './',
  build: {
    assetsInlineLimit: () => true,
    cssCodeSplit: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
  server: {
    proxy: {
      '/api/mal': {
        target: 'https://myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mal/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://myanimelist.net/',
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
