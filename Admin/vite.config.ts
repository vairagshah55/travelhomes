import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/admin/',
  server: {
    host: "::",
    port: 8081,
    proxy: {
      // Forward all API requests to the admin backend server in dev
      "/api": {
        // target:"https://travel-b.erpbuz.com/",
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/uploads": {
        // target:"https://travel-b.erpbuz.com/",
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [
    react({
      // Use automatic JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
