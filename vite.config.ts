import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv with an empty prefix loads ALL env vars (not just VITE_-prefixed),
  // so the dev server can read DEEPSEEK_API_KEY. Because this runs server-side
  // in the Vite dev server, the key is NEVER embedded in the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.DEEPSEEK_API_KEY
  const base = env.VITE_BASE_PATH || '/'

  // Proxy /llm/* → DeepSeek, injecting the Authorization header server-side so
  // the browser never sees the key and there is no CORS issue.
  const llmProxy: ProxyOptions = {
    target: 'https://api.deepseek.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/llm/, '/v1'),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (apiKey) {
          proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
        }
        proxyReq.setHeader('Content-Type', 'application/json')
      })
    },
  }

  return {
    base,
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/llm': llmProxy,
      },
    },
  }
})
