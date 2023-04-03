<script>
  import './app.css'
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
  import Webglview from './Webglview.svelte'
  import CodeMirror from "svelte-codemirror-editor";
  import {javascript} from "@codemirror/lang-javascript";
  import {cpp} from "@codemirror/lang-cpp";
  import {vim} from "@replit/codemirror-vim";
  import {oneDark} from "@codemirror/theme-one-dark";
  //let sdffunction  = "float sdf(vec3 p){\nreturn smin(p.y+1.0,length(p - vec3(0.0)) - 1.0,1.0);\n}";
  let sdffunction  = "float sdf(vec3 p){\n float radius = 1.0;  \n vec3 center= vec3(0.0,0.0,0.0); \n return length(p - center ) - radius;\n}";
  let examplecode="\
  <br>\
  <tt>\
    float smoothmin(float a,float b,float k)\{<br>\
      //this function merges two sdfs smoothly<br> \
      //k is smoothness factor,<br>\
      float h = max(k-abs(a-b),0.0)/k;<br>\
      return min(a,b)-h*h*h*k*(1.0/6.0);<br>\
    \}\
    <br>\
    <br>\
    float plane(vec3 p, float y)\{<br>\
    //sdf for a plane<br>\
    return p.y + y; <br>\
    \}<br> \
    <br>\
    float sphere(vec3 p,vec3 c,float r){<br>\
    //sdf for a sphere<br>\
    return length(p-c)-r;<br>\
    }<br>\
    <br>\
    float sdf(vec3 p){<br>\
    float sphere1 = sphere(p,vec3(0.0,1.0*sin(time),-5.0),1.0);<br>\
    float plane1 = plane(p,1.0);<br>\
    return smoothmin(sphere1,plane1,1.0);<br>\
    }<br>\
  </tt><br>\
  "
</script>

<main>
  <Webglview sdffunction={sdffunction} />
  <!--<CodeMirror bind:value={sdffunction} lang={cpp()} extensions={vim()} theme={oneDark}></CodeMirror>-->
  <CodeMirror bind:value={sdffunction} lang={cpp()}  theme={oneDark}></CodeMirror>
  {@html examplecode}
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
