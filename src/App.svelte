<script>
  import "./app.css";
  import Webglview from "./Webglview.svelte";
  import CodeMirror from "svelte-codemirror-editor";
  import { javascript } from "@codemirror/lang-javascript";
  import { cpp } from "@codemirror/lang-cpp";
  import { python } from "@codemirror/lang-python";
  import { vim } from "@replit/codemirror-vim";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { onMount } from "svelte";

  let codestringpython = "addobject(Sphere(1.0))\naddobject(Elongate(Sphere(1.0),(1.0,0.0,0.0)))"
  let codestringshader = `\nfloat sdf(vec3 p){\n float radius = 1.0;  \n vec3 center= vec3(0.0,0.0,0.0); \n return length(p - center) - radius;}\n`;

  let worker = new Worker(new URL("./pyworker.js", import.meta.url), {
    type: "classic",
  });
  worker.onerror = (e) => {
    console.log("error ", e);
  };
  worker.onmessage = (e) => {
    codestringshader = e.data.shaderstring;
  };

  onMount(() => {
    worker.postMessage(codestringpython);
    //generate_shader(codestringpython);
  });

  function generate_shader(codestringpython) {
      console.log(codestringpython);
    worker.postMessage(codestringpython);
  }

  function reCompile() {
    console.log("Recompiling")
    generate_shader(codestringpython);
  }
</script>

<main>
  <Webglview codestring={codestringshader} />
  <button on:click={reCompile}> Recompile </button>
  <CodeMirror bind:value={codestringpython} lang={python()} theme={oneDark} />
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
