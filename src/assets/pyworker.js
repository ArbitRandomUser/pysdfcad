//import {loadPyodide} from  'pyodide';
//import 'pyodide';
//import  'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.mjs'
//import "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js";
import "https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js";
//import 'pyodide';
//import * as pypkg from  'pyodide';
//
//import { loadPyodide } from 'https://pyodide-cdn2.iodide.io/dev/full/pyodide.mjs';
//import pyodide from 'https://cdn.jsdelivr.net/npm/pyodide@0.22.1/+esm'
//pyodide.loadPyodide();
//import {loadPyodide} from 'https://cdn.jsdelivr.net/npm/pyodide/+esm';
//await import {loadPyodide} from  'https://cdn.jsdelivr.net/pyodide/v0.23.0/full/'
//import * as pypkg from  'pyodide'
//pypkg.loadPyodide();
//importScripts('https://cdn.jsdelivr.net/npm/pyodide/+esm');
async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  console.log("pyodide done");
  await self.pyodide.loadPackage(["numpy", "pytz"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { id, python, ...context } = event.data;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  // Now is the easy part, the one that is similar to working in the main thread:
  try {
    await self.pyodide.loadPackagesFromImports(python);
    let results = await self.pyodide.runPythonAsync(python);
    self.postMessage({ results, id });
  } 
    catch (error) {
    self.postMessage({ error: error.message, id });
  }
};

//onmessage = ( (e)=>{console.log("from pyworker")});
