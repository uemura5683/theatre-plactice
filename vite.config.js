import { resolve } from "path";
import { defineConfig } from "vite";

const root = resolve(__dirname, "src");

export default defineConfig({
  root,
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        sample: resolve(root, "sample", "index.html"),
        multiple: resolve(root, "multiple-animation", "index.html"),
      },
    },
  },
  base: process.env.BASE_PATH ? "/240827_theatrejs/" : "./",
});
