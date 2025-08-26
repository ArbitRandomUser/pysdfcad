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
  import pycsg from "./assets/pycsg.py?raw"
  import { fade, slide } from 'svelte/transition';
  import pako from 'pako';

  let codestringpython = getCodeFromUrl() || localStorage.getItem('codestringpython') || `${defaultpython}`;
  //let codestringpython = `${defaultpython}`
  let codestringshader = `
float sdf(vec3 p){
 return 1e9;
 }
`;
  let pyodideready = false;
  let errorMessage = ''; 
  let editorVisible = false;

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
          worker.postMessage({run:"notfirst",code:codestringpython});
      } else if (e.data.shaderstring){
            codestringshader = e.data.shaderstring;
            errorMessage = ''; 
      } else if (e.data.error) {
            errorMessage = e.data.error.message; 
      }
  };

  onMount(() => {
      worker.postMessage({run:"first",code:pycsg});
  });

  $: if (codestringpython) {
      localStorage.setItem('codestringpython', codestringpython);
  }

  function generate_shader(codestringpython) {
      //console.log(codestringpython);
    worker.postMessage({run:"notfirst",code:codestringpython});
  }

  function reCompile() {
    console.log("Recompiling")
    //console.log(codestringpython);
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

  function uint8ArrayToBase64Url(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  function base64UrlToUint8Array(base64) {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(b64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  function getCodeFromUrl() {
    try {
      const hash = window.location.hash.substring(1);
      if (hash && hash.length > 0) {
        const uint8array = base64UrlToUint8Array(hash);
        const decompressed = pako.inflate(uint8array, { to: 'string' });
        return decompressed;
      }
    } catch (e) {
      console.error("Failed to read or decode code from URL hash.", e);
      history.pushState("", document.title, window.location.pathname + window.location.search);
      return null;
    }
    return null;
  }

  function generateShareableLink() {
    const compressed = pako.deflate(codestringpython);
    const encodedUrl = uint8ArrayToBase64Url(compressed);
    const url = `${window.location.origin}${window.location.pathname}#${encodedUrl}`;
    
    navigator.clipboard.writeText(url).then(() => {
      alert('Shareable link copied to clipboard!');
    }, () => {
      alert('Failed to copy the link.');
    });
  }

</script>

<main>
    <div class="side-by-side" >
    {#if editorVisible}
    <div class="editor-panel" transition:slide={{ axis: 'x'}}>
        <div class="codemirror-wrapper">
            <CodeMirror bind:value={codestringpython} editable={pyodideready} lang={python()} theme={oneDark} />
        </div>
    </div>
    {/if}
    <div class="view-panel" class:editor-hidden={!editorVisible}>
        {#if errorMessage}
          <div transition:slide class="error-message" style="color: red;">{errorMessage}</div>
        {/if}
        <Webglview codestring={codestringshader} />
        <div class="controls">
          <button on:click={generateSTLFile} disabled={!pyodideready}>Generate STL</button>
          <button on:click={toggleEditor}>
          {#if editorVisible}Hide Editor{:else}Show Editor{/if}
        </button>
        <button on:click={generateShareableLink}>Share</button>
        <button on:click={reCompile} disabled={!pyodideready}> Recompile </button>
        {#if !pyodideready}
          <div class="loading-indicator"></div>
        {/if}
        </div>
        Design stuff with python in your browser;<br>
        Zoom and rotate camera with mouse (pan coming soon)<br> 
        STL generation is not high resolution for now (will be fixed)<br>
        Proper docs coming soon, till then:<a href="https://github.com/ArbitRandomUser/pysdfcad/blob/b610e54f5cc992323894174f17e9897c6f729170/src/assets/pycsg.py#L118 " > you can check out the script here</a>
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
