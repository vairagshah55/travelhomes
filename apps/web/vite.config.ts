import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Unified Vite config for the merged Frontend + Admin app.
// Both areas now live under one app served from "/", with admin scoped
// to /admin/* routes via React Router (no base-path split needed).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:3001",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_API_BASE_URL || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    plugins: [react()],
    resolve: {
      alias: {
        // Single alias — admin code is no longer a separate tree.
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __DEV__: mode === "development",
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
  };
});
