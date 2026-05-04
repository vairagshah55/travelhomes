// Flat ESLint config covering all three apps.
// Run via: `npm run lint` (root) or `npx eslint <path>` directly.
//
// Strict rules are scoped per-app via overrides. Existing code is not strict
// today (Phase 1 baseline) — strictness will be tightened folder-by-folder.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  // ── Ignored paths ────────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/uploads/**",
      "**/invoices/**",
      "**/*.tsbuildinfo",
      "Photos/**",
      "Travel-Dist/**",
      "activities/**",
      "campervan/**",
      "onboarding/**",
      "unique-stays/**",
      // Large generated/data files
      "**/data/indian_cities.json",
      // Server one-off scripts (Phase 2 cleanup will sweep these)
      "Server/scripts/**",
      "Server/migrations/**",
      "Server/lib/email-sender/templates/**",
      // shadcn-generated UI primitives — own conventions
      "**/components/ui/**",
      // Vite runtime types
      "**/vite-env.d.ts",
    ],
  },

  // ── Base JS rules ────────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript (TSX/TS) — clients ───────────────────────────────────────────
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["Frontend/**/*.{ts,tsx}", "Admin/**/*.{ts,tsx}"],
  })),
  {
    files: ["Frontend/**/*.{ts,tsx}", "Admin/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React
      "react/react-in-jsx-scope": "off", // Vite + automatic JSX runtime
      "react/prop-types": "off", // We use TS for prop types
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Pragmatic relaxations for the existing codebase (tighten in Phase 3)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }],

      // Real bugs
      "no-undef": "off", // TS handles this
      "no-unreachable": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
    },
  },

  // ── Server (CommonJS + ESM) ─────────────────────────────────────────────────
  {
    files: ["Server/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-console": "off",
      "no-process-exit": "warn",
    },
  },
  {
    files: ["Server/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },

  // ── Test files: relax a bit ─────────────────────────────────────────────────
  {
    files: ["**/*.{spec,test}.{ts,tsx,js,jsx,mjs,cjs}", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },

  // ── Config files at root ────────────────────────────────────────────────────
  {
    files: ["*.{js,mjs,cjs}", "**/vite.config.{js,ts,mjs}", "**/*.config.{js,ts,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // ── Prettier compatibility (must be last) ───────────────────────────────────
  prettier,
];
