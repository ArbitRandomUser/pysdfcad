//sdf def comes before this
precision highp float;
#define MIN_HIT_DIST 0.0001
#define MAX_HIT_DIST 100.0
#define NO_MARCH_STEPS 200

//maybe too small increase if needed
#define SHADOW_MARCH_STEPS 30 
#define SHADOW_HIT_DIST 10.0

#define PI 3.1415926535


vec3 calcNormal(vec3  pos){ 
    const float h = 0.0001;      
    // prevents loop unrolling 
    #define ZERO (int(min(imgw,0.0)))
    vec3 n = vec3(0.0);
    //following is from Inigo's websits
    //e iterates through [+-1,+-1,+-1] points on a tetrahedron 
    for( int i=ZERO; i<4; i++){ 
        vec3 e = 0.577350269*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += sdf(pos+e*h)*e;
    }
    return normalize(n);
}

vec4 ray_march(in vec3 ro, in vec3 rd){
  vec3 curr_pos;
  float td = 0.0;
  float d;
  for (int i=0;i<NO_MARCH_STEPS && td < MAX_HIT_DIST;++i){
    curr_pos = ro+ td*rd;
    d = sdf(curr_pos);
    if (d <= MIN_HIT_DIST){
      return vec4(td,curr_pos);
    }
    td += d;
  }
  return vec4(td,curr_pos);
}

float softshadow(in vec3 ro, in vec3 rd, float k){
  float ret = 1.0;
  float td = 0.0;
  for (int i=0;i<SHADOW_MARCH_STEPS && td< SHADOW_HIT_DIST;i++) {
    float h = sdf(ro + td*rd);
    if (h<MIN_HIT_DIST)
      return 0.0;
    ret = min(ret,k*h/td);
    td+=h;
  }
  return ret;
}

float shadow( in vec3 ro, in vec3 rd)
{
    float t = 0.0;
    for( int i=0; i<256 && t<MAX_HIT_DIST; i++ )
    {
        float h = sdf(ro + rd*t);
        if( h<0.001 )
            return 0.0;
        t += h;
    }
    return 1.0;
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
  #define SKYBLUE 1.0*normalize(vec3(1,7,20))
  //#define SKYBLUE (vec3(3.0,7.0,4.5))
  #define SUNYELL 0.9*(vec3(7.0,4.5,3.0))
  #define MOONBLUE 0.3*vec3(7.0,4.5,3.3) 
  //#define BOURED normalize(vec3(0.7,0.3,0.2))
  //well actually its white, was initially red, 
  //#define BOUCOLOR vec3(1.0,1.0,1.0) 
  #define BOUCOLOR 0.1*SUNYELL 
  //#define BOURED vec3(4.5,3.0,7.0) 
  #define xdir  vec3(1.0,0.0,0.0)
  #define ydir  vec3(0.0,1.0,0.0)
  #define zdir  vec3(0.0,0.0,1.0)
  vec2 vUV = ((gl_FragCoord.xy - csize/2.0)*imgw)/csize[0]; 
  //vec2 mUV = ((mouse.xy - csize/2.0)*imgw)/csize[0]; 
  vec3 zproj = -1.0*normalize(lookat);
  vec3 yproj = normalize(ydir - dot(zproj,ydir)*zproj);
  vec3 xproj = normalize(cross(ydir,zproj));

  //camera and uv
  vec3 uv = camera + focus*normalize(lookat) + vUV.x*xproj + vUV.y*yproj;// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
  //vec3 muv = camera + focus*normalize(lookat) + mUV.x*xproj + mUV.y*yproj;// vec3(vUV.xy,0.0)*vec3(1.0,1.0,0.0);
   
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
  //vec3 moon_dir = normalize(vec3(0.0,-1.0,-1.0)); 
  vec3 moon_dir = -sun_dir; 

  float sun_diffuse = clamp(dot(norm,sun_dir),0.0,1.0);
  float moon_diffuse = clamp(dot(norm,moon_dir),0.0,1.0);
  //float sun_shad = 1.0-step(ray_march(pos+0.001*norm,sun_dir).x,MAX_HIT_DIST);
  float sun_shad = softshadow(pos+0.03*norm,sun_dir,4.0);
  float moon_shad = softshadow(pos+0.03*norm,moon_dir,4.0);
  //float sun_shad = shadow(pos+0.1*norm,sun_dir);
  float sky_diffuse = clamp(dot(norm,ydir),0.0,1.0);
  //float sky_shad = softshadow(pos+0.002*norm,ydir,4.0);
  float bou_diffuse = clamp(dot(norm,vec3(0.0,-1.0,0.0)),0.0,1.0);
  float bou_shad = softshadow(pos+0.03*norm,-ydir,4.0);

  //gradient sky
  vec3 col = vec3(0.65,0.75,0.9) - 0.9*vUV.y;
  //vec3 col = SKYBLUE - 0.9*vUV.y;
  if (marched<MAX_HIT_DIST){
    col = vec3(0.0);
    col += mate*SUNYELL * sun_diffuse * sun_shad;
    col += mate*MOONBLUE * moon_diffuse * moon_shad ;
    //col += mate*SKYBLUE * sky_diffuse * sky_shad; 
    col += mate*BOUCOLOR * bou_diffuse * bou_shad;
    col += vec3(0.1,0.1,0.1);
  }

  //grid
  vec3 gr = grid(ro,rd);
  if (gr.z <= marched && gr.z>0.0 && gr.z < 100.0){
    float thick;//thickness of grid
    float xythick=0.05;//size of axis markings 
    float planeopacity=-0.000;
    if (abs(gr.x)<xythick || abs(gr.y)<xythick){
      thick = 0.0010*sqrt(gr.z);
    }
    else{
      thick = 0.0005*sqrt(gr.z);//,0.5);
    }
    //this might be very roundabout way of doing this , make it simpler later;
    vec2 ll = 2.0-planeopacity-(smoothstep(vec2(-thick),vec2(0.0),(sin2(PI*gr.xy))) + smoothstep(vec2(0.0),vec2(thick),(sin2(PI*gr.xy))));
    if (abs(gr.x)<=xythick){
      col -= 2.0*vec3(0.00,1.0,1.0)*(ll.x+ll.y);
    }
    else if (abs(gr.y)<=xythick){
      col -= 2.0*vec3(1.0,0.10,1.0)*(ll.x+ll.y);
    }
    else{
    col -= 10.0*(ll.x+ll.y);
    }
  }
  fragColor = vec4(col,1.0);
}
