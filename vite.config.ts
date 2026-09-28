import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Safari < 16.4 / old Android browsers don't understand media query
    // range syntax (width <= 900px) — keep classic max-width queries.
    cssTarget: 'safari14',
  },
})
