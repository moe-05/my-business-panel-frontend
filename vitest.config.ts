import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Pruebas unitarias de logica pura (utils y helpers). Sin plugins de React ni
// Tailwind: no se renderizan componentes. El alias "@" replica vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
