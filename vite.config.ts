import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 510, // The intentionally tree-shaken Recharts vendor chunk is just over Vite's 500 kB default.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/d3-")) return "d3-vendor";
          if (id.includes("node_modules/react-is")) return "react-vendor";
          if (id.includes("node_modules/recharts")) return "recharts";
        },
      },
    },
  },
});
