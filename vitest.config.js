import { defineConfig } from "vitest/config";

// Server-side pure-logic tests (no DB, no network). The client has its own
// jsdom config under client/vitest.config.js.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.js", "tests/server/**/*.test.js"],
  },
});
