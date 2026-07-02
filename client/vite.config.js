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
    rollupOptions: {
      output: {
        manualChunks: {
          // Gom các thư viện nặng vào 1 chunk lớn
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['motion/react', 'framer-motion', 'lucide-react', '@radix-ui/react-slot'],
          'vendor-utils': ['axios', 'socket.io-client', 'zustand', 'toast-notifications', 'date-fns'],
        },
      }
    }
  }
})
