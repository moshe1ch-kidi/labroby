import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. הוספת base - זה קריטי ל-GitHub Pages. 
  // החלף את 'labroby' בשם ה-Repository המדויק שלך ב-GitHub.
  base: '/labroby/', 

  plugins: [react()],

  // 2. הגדרת root - מכיוון שאין לך תיקיית src, 
  // אנחנו מוודאים ש-Vite מסתכל על תיקיית השורש.
  root: './',

  build: {
    // 3. הגדרת outDir - לאן הקבצים המוכנים ילכו (בדרך כלל dist)
    outDir: 'dist',
    // מוודא שקבצי ה-Assets ייווצרו בצורה נכונה
    assetsDir: 'assets',
  },

  // 4. פתרון לבעיות טעינת קבצים מקומיים (אם יש)
  server: {
    fs: {
      allow: ['.']
    }
  }
})
