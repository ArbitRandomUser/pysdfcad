#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec3 camera;
uniform vec3 lookat;
uniform vec2 csize;
uniform float focus;
uniform float imgw;
uniform float time;
uniform vec2 mouse;

uniform Data {
  float data;
};


float smin(float a, float b, float k){
   float h = max(k-abs(a-b),0.0)/k;
   return min(a,b)-h*h*h*k*(1.0/6.0);
   //return min(a,b)-h*h*h*h*k*(1.0/8.0);
}
//sdf definition comes after this

