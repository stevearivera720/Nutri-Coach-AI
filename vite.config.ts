import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a relative base and output to `docs/` so GitHub Pages can serve from the `docs` folder on the main branch.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
