import { defineConfig } from "vite";
//import { viteStaticCopy } from "vite-plugin-static-copy";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(),],
  //server: {
  //  headers: {
  //    'Cross-Origin-Embedder-Policy': 'require-corp',
  //    'Cross-Origin-Opener-Policy': 'same-origin',
  //  },
  //}
  base: "/thangs/pysdfcad"
});

const config = {
  optimizeDeps: {
    exclude: [
      "pyodide",
      "codemirror",
      "@codemirror/autocomplete",
      "@codemirror/commands",
      "@codemirror/lang-css",
      "@codemirror/lang-html",
      "@codemirror/lang-javascript",
      "@codemirror/language",
      "@codemirror/state",
      "@codemirror/view",
      "marching-cubes-fast",
    ],
  },
};


