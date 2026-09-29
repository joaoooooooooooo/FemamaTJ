import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { readFileSync } from 'node:fs'

// Live displays can stay open across deployments. Their old JS still requests
// these PNG URLs when a flower variant appears for the first time. Keep the
// original files available; current clients continue to download only WebP.
const legacyFlowerAssets = [
  ['Flower 1.png', 'Flower 1-MUXjMSoR.png'],
  ['Flower 2.png', 'Flower 2-CdKkEiAX.png'],
  ['Flower 3.png', 'Flower 3-BSoAdNlE.png'],
] as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'preserve-legacy-flower-urls',
    apply: 'build',
    generateBundle() {
      for (const [sourceName, deployedName] of legacyFlowerAssets) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/${deployedName}`,
          source: readFileSync(path.resolve(import.meta.dirname, 'src/assets', sourceName)),
        })
      }
    },
  }],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: [
        "**/worker/**",
      ],
    },
  },
})
