import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Client component/lib tests in a jsdom environment. Kept separate from
// vite.config.js so the Tailwind plugin and dev proxy stay out of the test run.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
  },
});
