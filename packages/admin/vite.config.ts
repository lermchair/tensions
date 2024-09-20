import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ["module", "main"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ffjavascript: "ffjavascript/dist/node/index.js",
      snarkjs: "snarkjs/dist/node/index.js",
    },
  },
});
