import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  base: "/clerk",
  server: {
    port: 5175,
    proxy: {
      "/api": "http://localhost:8080"
    }
  },
  build: {
    outDir: "../../dist/clerk",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "../lib"),
      "@components": path.resolve(__dirname, "../lib/components")
    }
  }
});
