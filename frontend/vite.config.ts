import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('..', import.meta.url))
  const cwdEnv = loadEnv(mode, process.cwd(), '')
  const rootEnv = loadEnv(mode, rootDir, '')
  const pollinationsKey =
    cwdEnv.VITE_POLLINATIONS_API_KEY || rootEnv.VITE_POLLINATIONS_API_KEY || ''

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_POLLINATIONS_API_KEY': JSON.stringify(pollinationsKey),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})

