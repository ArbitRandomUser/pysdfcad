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
  import { generateSTL } from "./stlgenerator.js";
  import { runMarchingCubes } from "./marchingcubes.js";
  import defaultpython from "./default.py?raw"

  let codestringpython = defaultpython 
  let codestringshader = `
float sdf(vec3 p){
 return 1e9;
 }
`;
  let pyodideready = false;
  let errorMessage = ''; 

  let worker = new Worker(new URL("./pyworker.js", import.meta.url), {
    type: "classic",
  });
  worker.onerror = (e) => {
    console.log("error ", e);
    errorMessage = 'Worker error: ' + e.message; 
  };
  worker.onmessage = (e) => {
      if (e.data.type === 'pyodideready'){
          console.log("pyodide is ready");
          pyodideready = true;
          worker.postMessage(codestringpython);
      } else if (e.data.shaderstring){
            codestringshader = e.data.shaderstring;
            errorMessage = ''; 
      } else if (e.data.error) {
            errorMessage = e.data.error; 
      }
  };

  onMount(() => {
  });

  function generate_shader(codestringpython) {
      console.log(codestringpython);
      errorMessage = ''; 
    worker.postMessage(codestringpython);
  }

  function reCompile() {
    console.log("Recompiling")
    generate_shader(codestringpython);
  }

  const boundingBox = {
    min: [-5, -5, -5],
    max: [5 , 5, 5]
  };

  async function generateSTLFile() {
    const resolution = 128; 
    if (codestringshader) {
        const result = await runMarchingCubes(codestringshader, resolution, boundingBox);
        if (result) {
            generateSTL(result);
        }
    } else {
        alert("Please compile the code first to generate an SDF function.");
    }
  }
</script>

<main>
    Design stuff with python in your browser; 
    STL generation is not high resolution for now (will be fixed);
  <div class="side-by-side">
    <div class="editor-panel">
        <div class="codemirror-wrapper">
            <CodeMirror bind:value={codestringpython} editable={pyodideready} lang={python()} theme={oneDark} />
        </div>
        {#if errorMessage}
          <div class="error-message" style="color: red;">{errorMessage}</div>
        {/if}
    </div>
    <div class="view-panel">
        <Webglview codestring={codestringshader} />
        <button on:click={reCompile} disabled={!pyodideready}> Recompile </button>
        <button on:click={generateSTLFile} disabled={!pyodideready}>Generate STL</button>
        {#if !pyodideready}
          <div class="loading-indicator"></div>
        {/if}
    </div>
  </div>
</main>

<style>
  main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .header {
    flex-shrink: 0;
    padding-bottom: 1rem;
  }

  .side-by-side {
    flex-grow: 1;
    display: flex;
    gap: 16px;
    overflow: hidden;
    min-height: 0;
  }

  .editor-panel {
    width: 35%;
    max-width: 35% !important;
    flex-direction: column;
    min-width: 35%;
    min-height: 0;
  }

  .view-panel {
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    min-width: 65% !important;
  }
  
  .codemirror-wrapper {
    flex-grow: 1; 
    position: relative; 
  }

  :global(.cm-editor) {
      
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100%;
      width: 100%;
  }

  :global(.cm-scroller) {
      
      overflow: auto !important;
  }
 

  .error-message {
    flex-shrink: 0;
    max-height: 150px;
    max-width: 35%;
    overflow-y: auto;
    margin-top: 10px;
  }
  
  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-top: 10px;
    flex-shrink: 0;
  }
</style>
