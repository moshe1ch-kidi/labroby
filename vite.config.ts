import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/labroby/', // זה שם ה-Repository שלך, זה קריטי!
})
