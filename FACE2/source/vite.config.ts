import {defineConfig} from "vite";

export default defineConfig({
  base: "/FACE2/",
  publicDir: false,
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "runtime",
    target: "es2022"
  }
});
