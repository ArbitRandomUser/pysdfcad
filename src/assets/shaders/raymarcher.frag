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

float sphere(vec3 p, vec3 c, float r){
    return length(p - c) - r;
    //return 1&2;
}

float smin(float a, float b, float k){
   float h = max(k-abs(a-b),0.0)/k;
   return min(a,b)-h*h*h*k*(1.0/6.0);
   //return min(a,b)-h*h*h*h*k*(1.0/8.0);
}

float mergedspheres(vec3 p){
  return min(smin(sphere(p,vec3(0.5*sin(time)+0.75,0,-1.0),1.0),sphere(p,vec3(-0.5*sin(time)-0.75,0,-1.0),1.0),0.1),p.y+3.0);
}


vec3 calcNormal(vec3  pos){ 
    const float h = 0.0001;      
    #define ZERO (int(min(imgw,0.0))) // prevents loop unrolling 
    vec3 n = vec3(0.0);
    //following is from inigos websits
    //e iterates through [+-1,+-1,+-1] points on a tetrahedron 
    for( int i=ZERO; i<4; i++){ 
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += mergedspheres(pos+e*h)*e;
    }
    return normalize(n);
}

vec4 ray_march(in vec3 ro, in vec3 rd){
  vec3 curr_pos;
  float td_traveled = 0.0;
  const int NO_STEPS=1000;
  const float MIN_HIT_DIST = 0.001;
  const float MAX_HIT_DIST = 500.0;
  float d;

  for (int i=0;i<NO_STEPS;++i){
    curr_pos = ro+ td_traveled*rd;
    d = mergedspheres(curr_pos);
    if (d <= MIN_HIT_DIST){
      return vec4(15.0/pow(td_traveled,2.0),calcNormal(curr_pos));
    }
    if (td_traveled > MAX_HIT_DIST){
      break;
    }
    td_traveled += d;
  }
  return vec4(0,vec3(0.0,0.0,0.0));
}


void main(){
  vec2 vUV = ((gl_FragCoord.xy - csize/2.0)*imgw)/csize[0]; 
  vec2 mUV = ((mouse.xy - csize/2.0)*imgw)/csize[0]; 
  //TODO dont hardcode imgplane axis
  vec3 uv = camera + focus*normalize(lookat) + vUV.x*vec3(1.0,0.0,0.0) + vUV.y*vec3(0.0,1.0,0.0);// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
  vec3 muv = camera + focus*normalize(lookat) + mUV.x*vec3(1.0,0.0,0.0) + mUV.y*vec3(0.0,1.0,0.0);// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
  vec3 ro = camera;
  vec3 rd =  normalize(uv - camera);
  vec4 marched = ray_march(ro,rd);
  float shaded_color = marched.x*(dot(normalize(vec3(mUV.xy,1.5)) , marched.yzw));
  fragColor = vec4(shaded_color,0.0,0.0,1.0);
}
