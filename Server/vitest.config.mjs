import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["modules/**/__tests__/**/*.test.{js,mjs,cjs}"],
    // Each test file boots `config/env.js` indirectly. Make sure the validated
    // env loads from Server/.env (process cwd).
    setupFiles: [],
    testTimeout: 10_000,
  },
});
