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

  let codestringpython = "addobject(Rounding(Octahedron()))"
  let codestringshader = `
float sdf(vec3 p){
 float radius = 1.0;  
 vec3 center= vec3(0.0,0.0,0.0); 
 return length(p - center) - radius;}
`;
  let pyodideready = false;
  let errorMessage = ''; // New state variable for error messages

  let worker = new Worker(new URL("./pyworker.js", import.meta.url), {
    type: "classic",
  });
  worker.onerror = (e) => {
    console.log("error ", e);
    errorMessage = 'Worker error: ' + e.message; // Set error message on worker error
  };
  worker.onmessage = (e) => {
      if (e.data.type === 'pyodideready'){
          console.log("pyodide is ready");
          pyodideready = true;
          worker.postMessage(codestringpython);
      } else if (e.data.shaderstring){
            codestringshader = e.data.shaderstring;
            errorMessage = ''; // Clear error message on successful compilation
      } else if (e.data.error) {
            errorMessage = e.data.error; // Set error message from worker
      }
  };

  onMount(() => {
    //worker.postMessage(codestringpython);
    //generate_shader(codestringpython);
  });

  function generate_shader(codestringpython) {
      console.log(codestringpython);
      errorMessage = ''; // Clear error message before new compilation attempt
    worker.postMessage(codestringpython);
  }

  function reCompile() {
    console.log("Recompiling")
    generate_shader(codestringpython);
  }
</script>

<main>
  <Webglview codestring={codestringshader} />
  <button on:click={reCompile} disabled={!pyodideready}> Recompile </button>
  {#if !pyodideready}
    <div class="loading-indicator"></div>
  {/if}
  <CodeMirror bind:value={codestringpython} editable={pyodideready} lang={python()} theme={oneDark} />
  {#if errorMessage}
    <div class="error-message" style="color: red;">{errorMessage}</div>
  {/if}
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
