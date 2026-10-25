import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const msCore = env.VITE_MS_CORE_URL || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': { target: msCore, changeOrigin: true },
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': { target: msCore, changeOrigin: true },
      },
    },
  }
})
