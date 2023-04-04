//sdf def comes before this
precision highp float;
#define MIN_HIT_DIST 0.001
#define MAX_HIT_DIST 1000.0
#define NO_MARCH_STEPS 1024
#define PI 3.1415926535

vec3 calcNormal(vec3  pos){ 
    const float h = 0.0001;      
    #define ZERO (int(min(imgw,0.0))) // prevents loop unrolling 
    vec3 n = vec3(0.0);
    //following is from inigos websits
    //e iterates through [+-1,+-1,+-1] points on a tetrahedron 
    for( int i=ZERO; i<4; i++){ 
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += sdf(pos+e*h)*e;
    }
    return normalize(n);
}

vec4 ray_march(in vec3 ro, in vec3 rd){
  vec3 curr_pos;
  float td_traveled = 0.0;
  float d;
  for (int i=0;i<NO_MARCH_STEPS;++i){
    curr_pos = ro+ td_traveled*rd;
    d = sdf(curr_pos);
    if (d <= MIN_HIT_DIST){
      return vec4(td_traveled,curr_pos);
    }
    if (td_traveled > MAX_HIT_DIST){
      break;
    }
    td_traveled += d;
  }
  return vec4(td_traveled,curr_pos);
}

float softshadow(in vec3 ro, in vec3 rd, float k){
  float ret = 1.0;
  float td = 0.0;
  for (int i=0;i<NO_MARCH_STEPS && td< MAX_HIT_DIST;i++) {
    float h = sdf(ro + td*rd);
    if (h<MIN_HIT_DIST)
      return 0.0;
    ret = min(ret,k*h/td);
    td+=h;
  }
  return ret;
}

vec3 grid(vec3 ro, vec3 rd){
  //returns dist,bool(sorta);
  float td = -ro.y/rd.y ;
  float pz = ro.z+td*rd.z;
  float px = ro.x+td*rd.x;
  return vec3(px/1.0,pz/1.0,td);
}

vec2 sin2(vec2 a){
  return sin(a)*sin(a);
}

void main(){
  //#define SKYBLUE (vec3(0.1,0.7,0.9))
  #define SKYBLUE 2.0*normalize(vec3(1,7,9))
  //#define SKYBLUE (vec3(3.0,7.0,4.5))
  #define SUNYELL (vec3(7.0,4.5,3.0))
  //#define BOURED normalize(vec3(0.7,0.3,0.2))
  #define BOURED vec3(0.7,0.7,0.7) 
  //#define BOURED vec3(4.5,3.0,7.0) 
  #define xdir  vec3(1.0,0.0,0.0)
  #define ydir  vec3(0.0,1.0,0.0)
  #define zdir  vec3(0.0,0.0,1.0)
  vec2 vUV = ((gl_FragCoord.xy - csize/2.0)*imgw)/csize[0]; 
  vec2 mUV = ((mouse.xy - csize/2.0)*imgw)/csize[0]; 
  vec3 zproj = -1.0*normalize(lookat);
  vec3 yproj = normalize(ydir - dot(zproj,ydir)*zproj);
  vec3 xproj = normalize(cross(ydir,zproj));

  //camera and uv
  vec3 uv = camera + focus*normalize(lookat) + vUV.x*xproj + vUV.y*yproj;// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
  vec3 muv = camera + focus*normalize(lookat) + mUV.x*xproj + mUV.y*yproj;// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
   
  //march
  vec3 ro = camera;
  vec3 rd =  normalize(uv - camera);
  vec4 marchres = ray_march(ro,rd);
  vec3 pos = marchres.yzw;  //current hit position 
  float marched = marchres.x;//distance to hit position
  vec3 norm = calcNormal(ro+marched*rd);//normal at hit position

  //color, lighting and shadows
  vec3 mate = vec3(0.10);
  vec3 sun_dir = normalize(vec3(1.0,1.0,0.0)); 
  float sun_diffuse = clamp(dot(norm,sun_dir),0.0,1.0);
  //float sun_shad = 1.0-step(ray_march(pos+0.001*norm,sun_dir).x,MAX_HIT_DIST);
  float sun_shad = softshadow(pos+0.002*norm,sun_dir,16.0);
  float sky_diffuse = clamp(dot(norm,ydir),0.0,1.0);
  float sky_shad = softshadow(pos+0.002*norm,ydir,4.0);
  float bou_diffuse = clamp(dot(norm,vec3(0.0,-1.0,0.0)),0.0,1.0);
  float bou_shad = softshadow(pos+0.002*norm,-ydir,4.0);
    //gradient sky
  vec3 col = vec3(0.65,0.75,0.9) - 0.9*vUV.y;
  //vec3 col = SKYBLUE - 0.9*vUV.y;
  if (marched<MAX_HIT_DIST){
    col = vec3(0.0);
    col += mate*SUNYELL * sun_diffuse * sun_shad;
    col += mate*SKYBLUE * sky_diffuse * sky_shad; 
    col += mate*BOURED * bou_diffuse * bou_shad;
    col += vec3(0.1,0.1,0.1);
  }

  //grid
  vec3 gr = grid(ro,rd);
  if (gr.z <= marched && gr.z>0.0 && gr.z < 50.0){
    float thick = 0.001*sqrt(gr.z);//,0.5);
    vec2 ll = 2.0-(smoothstep(vec2(-thick),vec2(0.0),(sin2(PI*gr.xy))) + smoothstep(vec2(0.0),vec2(thick),(sin2(PI*gr.xy))));
    col -= ll.x+ll.y;
  }
  fragColor = vec4(col,1.0);
}
