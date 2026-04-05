import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Tambahin baris ini

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Tambahin ini juga
  ],
})