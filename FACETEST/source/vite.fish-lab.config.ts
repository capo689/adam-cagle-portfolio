import {defineConfig} from "vite";
import {resolve} from "node:path";

export default defineConfig({
  base: "/FACETEST/",
  publicDir: false,
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "runtime",
    target: "es2022",
    rollupOptions: {
      input: resolve(import.meta.dirname, "fish-lab.html")
    }
  }
});
