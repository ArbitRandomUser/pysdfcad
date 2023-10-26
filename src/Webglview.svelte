<script>
  import "./jscad.js";
  import { initShaderProgram } from "./shaderinit.js";
  import { initBuffers } from "./flatsheet.js";
  import { drawScene } from "./drawscene.js";
  import { onMount } from "svelte";
  import fsSource from "./assets/shaders/test.frag?raw";
  import vsSource from "./assets/shaders/canv.vert?raw";
  import raymarcher from "./assets/shaders/raymarcher.frag?raw";
  import prestring from "./assets/shaders/pre.frag?raw";
  import poststring from "./assets/shaders/post.frag?raw";
  import { vec3 } from "gl-matrix";
  export let codestring;
  //get mouse pos and canvas size;
  let piby180 = Math.PI / 180;
  let mousepos = [0, 0];
  let theta = 0.0; //*(3.1415/180);
  let phi = 45.0; //*(3.1415/180);
  let dist = 10.0;
  let focus = 1.0;
  let moving = false;
  let imgw = 1.0; //width of image plane, height derived from aspect ratio
  let shaderstring,
    canvas,
    csize,
    camerapos,
    lookat,
    gl,
    timeUniform,
    mouseUniform,
    csizeUniform,
    cameraUniform,
    focusUniform,
    lookatUniform,
    imgwUniform,
    programInfo,
    buffers,
    shaderProgram,
    anim,
    Data;

  //camerapos is reactive , changes when bunch of variables are changed, inturn lookat is changed and drawing is updated.
  $: {
    camerapos = [
      dist * Math.cos(theta * piby180) * Math.cos(phi * piby180),
      dist * Math.sin(phi * piby180),
      dist * Math.sin(theta * piby180) * Math.cos(phi * piby180),
    ];
    lookat = [...camerapos];
    for (let i = 0; i < lookat.length; i++) {
      lookat[i] = (-1.0 * camerapos[i]) / vec3.length(camerapos);
    }
    //first call fails because gl and other variables initialize only after onMount.
    if (gl != undefined) {
      updatedrawing();
    }
  }

  //recompile codestring when it changes.
  $: {
    codestring;
    if (gl != undefined) {
      reCompile();
    }
  }

  //update uniforms , used in updatedrawing.
  function updateuniforms() {
    gl.uniform1f(focusUniform, focus);
    gl.uniform2f(mouseUniform, mousepos[0], mousepos[1]);
    gl.uniform2f(csizeUniform, csize[0], csize[1]);
    gl.uniform3f(cameraUniform, camerapos[0], camerapos[1], camerapos[2]);
    gl.uniform3f(lookatUniform, lookat[0], lookat[1], lookat[2]);
    gl.uniform1f(imgwUniform, imgw);
  }

  //redefines shader and reattaches uniforms etc, used in reCompile and onMount.
  function redefshader() {
    shaderProgram = initShaderProgram(gl, vsSource, shaderstring);
    programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          "uProjectionMatrix"
        ),
        modelViewMatrix: gl.getUniformLocation(
          shaderProgram,
          "uModelViewMatrix"
        ),
      },
    };
    mouseUniform = gl.getUniformLocation(shaderProgram, "mouse");
    csizeUniform = gl.getUniformLocation(shaderProgram, "csize");
    cameraUniform = gl.getUniformLocation(shaderProgram, "camera");
    focusUniform = gl.getUniformLocation(shaderProgram, "focus");
    lookatUniform = gl.getUniformLocation(shaderProgram, "lookat");
    imgwUniform = gl.getUniformLocation(shaderProgram, "imgw");
  }

  //updates the scene
  function updatedrawing() {
    updateuniforms();
    drawScene(gl, programInfo, buffers);
  }

  onMount(() => {
    gl = canvas.getContext("webgl2", { antialias: true }, "true");
    if (gl == null) {
      alert("unable to init webgl");
    }
    csize = [canvas.width, canvas.height];
    buffers = initBuffers(gl);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shaderstring = prestring.concat("\n", codestring.concat("\n", poststring));
    redefshader();
    updatedrawing();
    updatedrawing(); //not really sure why this is needed twice. for some reason object isnt rendered on mount with just one updatedrawing().
  });

  function reCompile() {
    shaderstring = prestring.concat("\n", codestring.concat("\n", poststring));
    redefshader();
    updatedrawing();
    updatedrawing();
  }

  //Mouse interactivity with the canvas
  //changes view parameters on mouse interaction;
  //camera updates reactively;
  function onMouseDown() {
    moving = true;
  }

  function onMouseMove(e) {
    if (moving) {
      theta += 0.1 * e.movementX;
      if (phi + 0.1 * e.movementY > 90) {
        phi = 90.0;
      } else if (phi + 0.1 * e.movementY < -90) {
        phi = -90.0;
      } else {
        phi += 0.1 * e.movementY;
      }
    }
  }

  function onMouseUp() {
    moving = false;
  }

  function onMouseWheel(e) {
    e.preventDefault();
    dist += e.deltaY * 0.01;
  }

  function onMouseLeave() {
    moving = false;
  }
</script>

<canvas
  on:mousemove={onMouseMove}
  on:mouseleave={onMouseLeave}
  on:mousedown={onMouseDown}
  on:mouseup={onMouseUp}
  on:wheel={onMouseWheel}
  bind:this={canvas}
  width="1280"
  height="720"
/>
