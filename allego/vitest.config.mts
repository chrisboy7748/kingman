import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Le paquet server-only refuse d'être importé hors de Next.js.
      "server-only": path.resolve(import.meta.dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://allego:allego@localhost:5432/allego_test",
      PAYPAL_PLAN_MONTHLY: "P-MENSUEL",
      PAYPAL_PLAN_YEARLY: "P-ANNUEL",
    },
    fileParallelism: false,
  },
});
