<script>
  import './jscad.js' 
  import {initShaderProgram} from './shaderinit.js'
  import {initBuffers} from './flatsheet.js'
  import {drawScene} from './drawscene.js'
  import {onMount} from 'svelte'
  import fsSource from './assets/shaders/test.frag?raw'
  import vsSource from './assets/shaders/canv.vert?raw'
  import raymarcher from './assets/shaders/raymarcher.frag?raw'
  import prestring from './assets/shaders/pre.frag?raw'
  import poststring from './assets/shaders/post.frag?raw'
  import {vec3} from 'gl-matrix'
  export let sdffunction;
  let databuffer;
  let canvas;
  let csize;
  //get mouse pos and canvas size;
  let piby180 = Math.PI/180;
  let mousepos=[0,0];
  let theta= 0.0//*(3.1415/180);
  let phi = 45.0//*(3.1415/180);
  let dist = 10.0;
  let camerapos = [dist*Math.cos(theta*piby180)*Math.cos(phi*piby180),dist*Math.sin(phi*piby180),dist*Math.sin(theta*piby180)*Math.cos(phi*piby180)];
  let focus = 1.0; 
  let lookat = [...camerapos]//vec3.length(camerapos);
  for (let i=0;i<lookat.length;i++){
    lookat[i] = -1.0*camerapos[i]/vec3.length(camerapos);
  }
  let moving=false;
  let imgw = 1.0;//width of image plane, height derived from aspect ratio
  //let csize=[canvas.innerWidth/imgw,canvas.innerHeight/imgw]
  let gl,timeUniform,mouseUniform,csizeUniform,cameraUniform,focusUniform,lookatUniform,imgwUniform,programInfo,buffers,shaderProgram,anim,Data;
  function getcoords(event){
    let rect = event.target.getBoundingClientRect();
    let scaleX = event.target.width/rect.width; 
    let scaleY = event.target.height/rect.height; 
    let x = (event.clientX - rect.left)*scaleX; 
    let y = (rect.bottom-event.clientY)*scaleY; 
    mousepos[0]=x;
    mousepos[1]=y;
  }

  function updatedrawing() {
    let t=1.0;
    gl.uniform1f(timeUniform,t/1000.0);
    gl.uniform1f(focusUniform,focus);
    gl.uniform2f(mouseUniform,mousepos[0],mousepos[1]);
    gl.uniform2f(csizeUniform,csize[0],csize[1]);
    gl.uniform3f(cameraUniform,camerapos[0],camerapos[1],camerapos[2]);
    gl.uniform3f(lookatUniform,lookat[0],lookat[1],lookat[2]);
    gl.uniform1f(imgwUniform,imgw);
    drawScene(gl,programInfo,buffers);
    //anim = requestAnimationFrame(updatedrawing)
  }

  onMount(()=> {
    gl = canvas.getContext("webgl2");
    if (gl==null){
      alert("unable to init webgl");
    }
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    let sstring = prestring.concat("\n",sdffunction.concat("\n",poststring)); 
    shaderProgram = initShaderProgram(gl,vsSource, sstring);
    programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      },
    };
    buffers = initBuffers(gl);
    csize=[canvas.width,canvas.height]
    databuffer = gl.createBuffer();
    let a=[1,2,3,4];
    let ref = gl.getUniformBlockIndex(shaderProgram,"Data");
    gl.uniformBlockBinding(shaderProgram,ref,1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER,1,databuffer);
    //gl.bufferData(gl.UNIFORM_BUFFER,new Float32Array(a),gl.DYNAMIC_DRAW,0,4);
    gl.bufferData(gl.UNIFORM_BUFFER,13*16,gl.DYNAMIC_DRAW);


    mouseUniform = gl.getUniformLocation(shaderProgram,"mouse");
    timeUniform=gl.getUniformLocation(shaderProgram,"time");
    csizeUniform=gl.getUniformLocation(shaderProgram,"csize");
    cameraUniform=gl.getUniformLocation(shaderProgram,"camera"); 
    focusUniform = gl.getUniformLocation(shaderProgram,"focus");
    lookatUniform = gl.getUniformLocation(shaderProgram,"lookat");
    imgwUniform = gl.getUniformLocation(shaderProgram,"imgw");
    updatedrawing();
  })

  function reCompile(){
    //cancelAnimationFrame(anim);
    let shaderstring = prestring.concat("\n",sdffunction.concat("\n",poststring))
    //gl.deleteShader(shaderProgram);
    shaderProgram = initShaderProgram(gl,vsSource,shaderstring);
    programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      },
    };
    buffers = initBuffers(gl);
    csize=[canvas.width,canvas.height]
    mouseUniform = gl.getUniformLocation(shaderProgram,"mouse");
    timeUniform=gl.getUniformLocation(shaderProgram,"time");
    csizeUniform=gl.getUniformLocation(shaderProgram,"csize");
    cameraUniform=gl.getUniformLocation(shaderProgram,"camera"); 
    focusUniform = gl.getUniformLocation(shaderProgram,"focus");
    lookatUniform = gl.getUniformLocation(shaderProgram,"lookat");
    imgwUniform = gl.getUniformLocation(shaderProgram,"imgw");
    updatedrawing();
    //recompiles a new shader that renderes sdfstring
  }
  
  function onMouseDown() {
    moving = true;
    updatedrawing();
  }

  function onMouseMove(e) {
    if (moving) {
      theta += 0.1*e.movementX;
      if (phi+ 0.1*e.movementY > 90){ 
        phi=90.00;
      }
      else if (phi+0.1*e.movementY < -90){
        phi=-90.00
      }
      else{
        phi += 0.1*e.movementY
      }
      camerapos = [dist*Math.cos(theta*piby180)*Math.cos(phi*piby180),dist*Math.sin(phi*piby180),dist*Math.sin(theta*piby180)*Math.cos(phi*piby180)];
    }
  lookat = [...camerapos]//vec3.length(camerapos);
  for (let i=0;i<lookat.length;i++){
    lookat[i] = -1.0*camerapos[i]/vec3.length(camerapos);
  }
    updatedrawing();
  }

  function onMouseUp() {
    moving = false;
    updatedrawing();
  }

  function onMouseWheel(e){
    e.preventDefault();
    dist += e.deltaY*0.01;
    camerapos = [dist*Math.cos(theta*piby180)*Math.cos(phi*piby180),dist*Math.sin(phi*piby180),dist*Math.sin(theta*piby180)*Math.cos(phi*piby180)];
    updatedrawing();
  }

  //TODO fix/implment zoom on scroll;
</script>

  <canvas on:mousemove={onMouseMove} on:mousedown={onMouseDown} on:mouseup={onMouseUp} on:wheel={onMouseWheel}  bind:this={canvas} width="1280" height="720"></canvas>
<button on:click={reCompile}> Recompile </button>
