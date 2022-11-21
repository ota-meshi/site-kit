import { resolve } from "path";
import { defineConfig } from "vite";
import { vue2Plugin } from "../site-kit-vite-plugin-vue2/vite-config-builder.js";
import { bundleCssPlugin } from "../site-kit-vite-plugins/index.js";

export default defineConfig({
  plugins: [vue2Plugin(), bundleCssPlugin({ fileName: "ESLintEditor.vue2" })],
  build: {
    outDir: __dirname,
    cssCodeSplit: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "ESLintEditor.vue"),
      name: "ESLintEditor",
      // the proper extensions will be added
      fileName: "ESLintEditor.vue2",
      formats: ["es"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue", "@ota-meshi/site-kit-monaco-editor"],
    },
  },
});
