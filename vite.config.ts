import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // FastAPI backend runs on port 8000 in development
        // Run: cd backend && uvicorn main:app --reload --port 8000
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
