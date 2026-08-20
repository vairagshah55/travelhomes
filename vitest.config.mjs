import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Root Vitest config — covers the whole workspace.
 *
 * Running `npx vitest` from the repo root previously found no config at all
 * (Server/vitest.config.mjs only applies when run from inside Server/), so it
 * fell back to defaults with no path aliases. Every spec under apps/web that
 * pulls in a file importing `@/...` therefore failed to collect:
 *
 *   Error: Cannot find package '@/lib/utils' imported from featureIcons.tsx
 *
 * featureIcons.spec.ts had never executed a single assertion because of it — it
 * only ever reported as a failed suite. The alias below mirrors
 * apps/web/vite.config.ts so the app and its tests resolve imports identically.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(here, "apps/web/src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: [
      "apps/web/src/**/*.{spec,test}.{ts,tsx}",
      "Server/modules/**/__tests__/**/*.test.{js,mjs,cjs}",
      "Server/shared/__tests__/**/*.test.{js,mjs,cjs}",
    ],
    testTimeout: 10_000,
  },
});
