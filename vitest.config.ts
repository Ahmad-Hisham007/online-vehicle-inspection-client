import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    exclude: [".opencode/**", "e2e/**", "node_modules/**"],
    coverage: {
      exclude: [
        ".opencode/**",
        "components/ui/**",
        "**/index.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
