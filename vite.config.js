import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { singleFile } from './scripts/single-file.js'
import { extensionAssets } from './scripts/extension-assets.js'
import { EXTENSION_TARGETS } from './extensions/manifest.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const extensionTarget = mode.startsWith('extension-') ? mode.slice('extension-'.length) : null
  if (extensionTarget && !EXTENSION_TARGETS.includes(extensionTarget)) throw new Error(`Unknown extension target: ${extensionTarget}`)
  return {
    plugins: [react(), extensionTarget ? extensionAssets(extensionTarget) : singleFile()],
    base: './',
    build: {
      outDir: extensionTarget ? `dist-extensions/${extensionTarget}` : 'dist',
      assetsInlineLimit: extensionTarget ? 0 : () => true,
      cssCodeSplit: !!extensionTarget,
      rolldownOptions: { output: { codeSplitting: extensionTarget ? {
        groups: [{ name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ }],
      } : false } },
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
      include: ['src/**/*.test.{js,jsx}', 'workers/**/*.test.js'],
      environment: 'jsdom',
      globals: true
    }
  }
})
