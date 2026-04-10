import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: `${env.VITE_API_BASE_URL}`,
          changeOrigin: true,
        },
        "/uploads": {
          target: `${env.VITE_API_BASE_URL}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [
      react({
        jsxRuntime: "classic",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
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
