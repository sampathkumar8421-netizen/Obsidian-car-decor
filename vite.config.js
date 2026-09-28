import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/gsap")) return "gsap";
          if (id.includes("node_modules/animejs")) return "animejs";
        },
      },
    },
  },
});
