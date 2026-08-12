import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// public/sw.js é copiado cru pelo Vite (sem substituição de env). Este plugin
// injeta a url do Supabase no placeholder em dist/sw.js no build — evita a URL
// hardcoded no repo e permite trocar de projeto sem tocar no código.
function injectSwEnv(): Plugin {
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  let supabaseUrl = ''
  return {
    name: 'inject-sw-env',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '')
      supabaseUrl = env.VITE_SUPABASE_URL || ''
    },
    closeBundle() {
      const code = readFileSync(`${rootDir}/public/sw.js`, 'utf8')
      const injected = code.split('__SUPABASE_URL__').join(supabaseUrl)
      writeFileSync(`${rootDir}/dist/sw.js`, injected)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectSwEnv(),
  ],
})
