import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ["stream", "util"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: {},
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
