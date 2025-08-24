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
  import { fade, slide } from 'svelte/transition';

  let codestringpython = defaultpython 
  let codestringshader = `
float sdf(vec3 p){
 return 1e9;
 }
`;
  let pyodideready = false;
  let errorMessage = ''; 
  let editorVisible = true;

  function toggleEditor() {
    editorVisible = !editorVisible;
  }

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
    <div class="side-by-side" >
    {#if editorVisible}
    <div class="editor-panel" transition:slide={{ axis: 'x'}}>
        <div class="codemirror-wrapper">
            <CodeMirror bind:value={codestringpython} editable={pyodideready} lang={python()} theme={oneDark} />
        </div>
        {#if errorMessage}
          <div transition:slide class="error-message" style="color: red;">{errorMessage}</div>
        {/if}
    </div>
    {/if}
    <div class="view-panel" class:editor-hidden={!editorVisible}>
        <Webglview codestring={codestringshader} />
        <div class="controls">
          <button on:click={reCompile} disabled={!pyodideready}> Recompile </button>
          <button on:click={generateSTLFile} disabled={!pyodideready}>Generate STL</button>
          <button on:click={toggleEditor}>
          {#if editorVisible}Hide Editor{:else}Show Editor{/if}
        </button>
        {#if !pyodideready}
          <div class="loading-indicator"></div>
        {/if}
        </div>
        Design stuff with python in your browser; 
        STL generation is not high resolution for now (will be fixed);
    </div>
  </div>
</main>

<style>
  main {
  }

  .header {
    flex-shrink: 0;
    padding-bottom: 1rem;
  }

  .side-by-side {
    flex-grow: 1;
    display: flex;
    gap: 10px;
    overflow: hidden;
    min-height: 0;
  }

  .side-by-side.editor-hidden {
      justify-content:center;
  }

  .editor-panel {
    position:absolute;
    top:10px;
    left:10px;
    width: 35%;
    max-width: 35% !important;
    flex-direction: column;
    min-height: 0;
  }

  .view-panel {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .codemirror-wrapper {
    flex-grow: 1; 
    position: relative; 
  }

  :global(.cm-editor) {
      position: relative;
      height: 100vh;
      max-height:1000px;
      width: 35vw;
  }

  :global(.cm-scroller) {
      overflow: auto !important;
      overflow-y: auto;
  }
 

  .error-message {
      position: absolute;
      top: 0;
      right: 0;
    flex-shrink: 0;
    max-width: 35%;
  }
  
  .controls {
    display: flex;
    justify-content:right;
    gap: 10px;
    align-items: center;
    padding-top: 10px;
    flex-shrink: 0;
  }
</style>
