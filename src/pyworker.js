let pyodide;
importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");
async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  console.log("pyodide loaded");
  await pyodide.loadPackage(["numpy", "pytz"]);
  self.postMessage({ type: 'pyodideready' }); // Notify App.svelte that Pyodide is ready    
}
let pyodideReadyPromise = loadPyodideAndPackages();

onmessage = async (event) => {
  await pyodideReadyPromise;
  try {
    if (event.data.run != "first"){
      await pyodide.runPython("clearobjects()");
    }
    await pyodide.runPython(event.data.code);
    let results = await pyodide.runPython("makescenejson()");
    let res = JSON.parse(results);
    let midstring = res['shader']
    let shaderstring = midstring;
    postMessage({ shaderstring: shaderstring });
  } catch (error) {
      const fullError = error.message;
      let userError;
      const execStartIndex = fullError.indexOf('File "<exec>"');
      if (execStartIndex !== -1) {
        userError = fullError.substring(execStartIndex);
      } else {
        const lines = fullError.split('\n').filter(line => line.trim() !== '');
        userError = lines.pop() || "An unknown Python error occurred.";
      }
      console.log(fullError)
      postMessage({ error: { message: userError } });
  }
};
