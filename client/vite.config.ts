import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = import.meta.dirname;

const appBackendUrl = process.env.APP_URL || "http://localhost:3001";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": appBackendUrl,
      "/admin": appBackendUrl,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
