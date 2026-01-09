import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // השורה הזו פותרת את שגיאת ה-404 ב-GitHub Pages
  base: '/labroby/',
  build: {
    chunkSizeWarningLimit: 1600,
  }
})
