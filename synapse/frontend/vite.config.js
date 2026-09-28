import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isIpadLanDev = process.env.npm_lifecycle_event === 'dev:lan'
const disablePwa = process.env.VITE_DISABLE_PWA === '1'

const backendProxy = {
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
  ws: true,
};

/**
 * /teacher/* is used by BOTH React pages and FastAPI.
 * Never proxy browser document navigations to the API.
 */
function shouldServeSpa(req) {
  const accept = String(req.headers.accept || "")
  const dest = String(req.headers["sec-fetch-dest"] || "")
  const path = String(req.url || "").split("?")[0]

  // Full page loads → always React
  if (dest === "document" || accept.includes("text/html")) return true

  // Exact SPA routes (no matching FastAPI path at the same exact URL)
  const exactSpa = new Set([
    "/teacher/dashboard",
    "/teacher/children",
    "/teacher/sessions-hub",
    "/teacher/reports",
    "/teacher/settings",
  ])
  if (exactSpa.has(path)) return true

  // SPA: /teacher/students/:id  | API: /teacher/students/:id/profile
  if (/^\/teacher\/students\/[^/]+$/.test(path)) return true

  // SPA history pages
  if (path.startsWith("/teacher/child/")) return true
  if (/^\/teacher\/session\/[^/]+$/.test(path)) return true // ActiveSession (singular)

  // SPA live page vs API live JSON share the same path.
  // Prefer SPA unless the client clearly wants JSON.
  if (/^\/teacher\/sessions\/[^/]+\/live$/.test(path)) {
    if (accept.includes("application/json") && !accept.includes("text/html")) return false
    if (dest === "empty" || dest === "document") return dest === "document"
    // axios usually sends application/json; browser bar navigations often send */*
    if (accept === "*/*" || accept === "" || accept.includes("text/html")) return true
  }

  return false
}

const teacherProxy = {
  ...backendProxy,
  bypass(req) {
    if (shouldServeSpa(req)) return "/index.html"
  },
}

export default defineConfig({
  plugins: [
    react(),
    !disablePwa &&
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['synapse-logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'SyNAPSE – Emotion-Aware AAC',
        short_name: 'SyNAPSE',
        description: 'Emotion-aware AAC platform for neurodiverse children',
        theme_color: '#1a3a5c',
        background_color: '#ffffff',
        display: 'fullscreen',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      }
    })
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: {
    host: true,
    hmr: isIpadLanDev ? false : undefined,
    proxy: {
      "/api": backendProxy,
      "/auth": backendProxy,
      "/teacher": teacherProxy,
      "/health": backendProxy,
      "/ws": backendProxy,
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": backendProxy,
      "/auth": backendProxy,
      "/teacher": teacherProxy,
      "/health": backendProxy,
      "/ws": backendProxy,
    },
  },
})
