import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(),],
  //server: {
  //  headers: {
  //    'Cross-Origin-Embedder-Policy': 'require-corp',
  //    'Cross-Origin-Opener-Policy': 'same-origin',
  //  },
  //}
  //base: "/thangs/sdfcsg"
});

const config = {
  optimizeDeps: {
    exclude: [
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


