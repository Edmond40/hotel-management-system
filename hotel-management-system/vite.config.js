import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // UI and animation libraries
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-toastify'],
          
          // Routing and state management
          'router-vendor': ['react-router-dom'],
          'state-vendor': ['zustand'],
          
          // Utility libraries
          'utils-vendor': ['axios', 'aos']
        }
      }
    }
  }
})