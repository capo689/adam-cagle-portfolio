import {defineConfig} from "vite";

export default defineConfig({
  base: "/FACE3/",
  publicDir: false,
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "runtime",
    target: "es2022"
  }
});
