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
    // @vitejs/plugin-react-swc defaults to the automatic JSX runtime, which
    // matches "jsx": "react-jsx" in tsconfig.json. Component files no longer
    // need an explicit `import React`. The previous `jsxRuntime: "classic"`
    // is no longer a valid option in the current plugin version (TS2353)
    // and was forcing 82 UMD-global errors across 13 component files.
    plugins: [react()],
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
