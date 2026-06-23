import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,   // Mở trên mạng LAN (để mobile truy cập được)
    https: true,  // Bật HTTPS (bắt buộc cho WebRTC/camera trên mobile)
  },
})
