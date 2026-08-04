import {defineConfig} from "vite";

export default defineConfig({
  base: "/FACETEST/",
  publicDir: false,
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "runtime",
    target: "es2022"
  }
});
