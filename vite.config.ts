import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// public/sw.js é copiado cru pelo Vite (sem substituição de env). Este plugin
// injeta a anon key no placeholder em dist/sw.js no build — evita a chave
// hardcoded no repo e permite rotação sem tocar no código.
function injectSwEnv(): Plugin {
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  let anonKey = ''
  return {
    name: 'inject-sw-env',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '')
      anonKey = env.VITE_SUPABASE_ANON_KEY || ''
    },
    closeBundle() {
      const code = readFileSync(`${rootDir}/public/sw.js`, 'utf8')
      writeFileSync(`${rootDir}/dist/sw.js`, code.split('__SUPABASE_ANON_KEY__').join(anonKey))
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
