precision highp float;

uniform vec3 u_resolution;
uniform float u_slice;

uniform vec3 u_bbox_min;
uniform vec3 u_bbox_max;

// This is a placeholder that will be replaced by the SDF from pycsg.py
float map(vec3 pos){}

void main() {
    vec3 normalized_coord = gl_FragCoord.xyz / u_resolution;
    vec3 pos = mix(u_bbox_min, u_bbox_max, normalized_coord);
    pos.z = mix(u_bbox_min.z, u_bbox_max.z, u_slice);
    float dist = sdf(pos);
    fragColor = vec4(dist, 0.0, 0.0, 1.0);
}
