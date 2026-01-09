import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/labroby/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600, // מעלה את רף האזהרה
    rollupOptions: {
      output: {
        // פיצול ספריות חיצוניות לקבצים נפרדים כדי להקל על הטעינה
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
})
