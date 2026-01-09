import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // השורה שמתחת היא הקריטית לפתרון המסך הלבן ב-GitHub Pages
  base: '/labroby/',
  build: {
    // הגדרה שעוזרת למנוע שגיאות זיכרון ב-Build של ספריות כבדות כמו Three.js
    chunkSizeWarningLimit: 1600,
  }
})
