import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Sequential execution — Sejong portal rejects concurrent login sessions
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      concurrent: false,
    },
    testTimeout: 30000,
  },
});
