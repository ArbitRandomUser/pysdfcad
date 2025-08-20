importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");
let chunkcount = 0;
async function loadPyodideAndPackages() {
  //self.pyodide = await loadPyodide({fullStdLib: true});
  pyodide = await loadPyodide();
  console.log("pyodide loaded");
  await self.pyodide.loadPackage(["numpy", "pytz"]);
  await pyodide.runPython(await (await fetch("./assets/pycsg.py")).text());
  self.postMessage({ type: 'pyodideready' }); // Notify App.svelte that Pyodide is ready    
}
let pyodideReadyPromise = loadPyodideAndPackages();

function buildMinTree(shaders) {
  if (!shaders || shaders.length === 0) {
    return "0.0"; // Default for empty set
  }
  if (shaders.length === 1) {
    return shaders[0];
  }

  const mid = Math.floor(shaders.length / 2);
  const leftSide = buildMinTree(shaders.slice(0, mid));
  const rightSide = buildMinTree(shaders.slice(mid));
  return `min(${leftSide}, ${rightSide})`;
}

let trigcount=0;
onmessage = async (event) => {
  // make sure loading is done
  chunkcount=0;
  await pyodideReadyPromise;
  try {
    await pyodide.runPython("clearobjects()");
    await pyodide.runPython(event.data);
    let results = await pyodide.runPython("makescenejson()");
    res = JSON.parse(results);
    midstring = res['shader']
    
    shaderstring = midstring;
    //console.log(shaderstring);
    postMessage({ shaderstring: shaderstring });
  } catch (error) {
    postMessage({ error: error.message });
  }
};
