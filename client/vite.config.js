import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,   // Mở trên mạng LAN (để mobile truy cập được)
  },
  build: {
    chunkSizeWarningLimit: 1000, // Tăng giới hạn lên 1000 kB (1 MB)
  },
})
