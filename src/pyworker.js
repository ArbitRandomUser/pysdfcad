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

function get_glsl_objects(objects) {
  //generates sdf of these objects together and assigns it to varname(unique)
  let varname;
  varname = `chunk${chunkcount}`; 
  chunkcount = chunkcount + 1;
  let prestring = `float ${varname} =`;
  let midstring = "";
  let poststring = ";\n";
  for (let i = 0; i < objects.length; i++) {
    if (i != objects.length - 1) {
      midstring = `${midstring} min(${objects[i].shader},`;
    } else {
      midstring = `${midstring} ${objects[i].shader} ${")".repeat(
        objects.length - 1
      )}`;
    }
  }
  console.log(`${prestring}${midstring}${poststring};`)
  return `${prestring}${midstring}${poststring};`;
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
    let prestring = "float sdf(vec3 pcoord){\n";
    let poststring = ";}\n";
    res = JSON.parse(results);
    let pcoordshaders = res["pcoords"]

    let objectstrings = res["objects"];
    let objects = [];
    no_objects = objectstrings.length;
    for (let i = 0; i < no_objects; i++) {
      objects.push(JSON.parse(objectstrings[i]));
    }
    let midstring = "";
    let chunksize = 100;
    for (let i=0;i<no_objects;i=i+chunksize){
      midstring = `${midstring} ${get_glsl_objects(objects.slice(i,i+chunksize))}`;
    }
    let midstring2 = "return ";
    for (let i=0;i<chunkcount;i++){
      if (i!=chunkcount-1){
      midstring2 = `${midstring2} min(chunk${i},`;
      }else{
        midstring2 = `${midstring2} chunk${i} ${")".repeat(chunkcount-1)}` ;
      }
    }
    shaderstring = `${prestring} ${pcoordshaders} ${midstring} ${midstring2} ${poststring}`;
    console.log(shaderstring);
    postMessage({ objects: objects, shaderstring: shaderstring });
  } catch (error) {
    postMessage({ error: error.message });
  }
};
