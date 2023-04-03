precision highp float;
uniform float time;
uniform vec2 mouse; 
uniform vec2 csize;
vec4 coord;
void main() {
  coord = gl_FragCoord;
  float r = sin(0.051*distance(mouse.xy,coord.xy) - 1.0*time);
  float g = cos(0.05*distance(mouse.xy,coord.xy) - 3.14159*time);
  float b = cos(0.049*distance(mouse.xy,coord.xy) - 1.41421*time);
  gl_FragColor = vec4(r,g,b,1.0);
  //if (distance(mouse.xy,gl_FragCoord.xy)<10.0) {
  //  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  //}
  //else {
  //  gl_FragColor = vec4(0.0,0.0,0.0,1.0);
  //}
}
