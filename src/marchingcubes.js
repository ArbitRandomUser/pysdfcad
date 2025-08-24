import mc from 'marching-cubes-fast';
import sdfEvalShader from './assets/shaders/sdf_eval.frag?raw';
import preFrag from './assets/shaders/pre.frag?raw';

export async function runMarchingCubes(sdf, resolution, boundingBox) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("WebGL2 not supported");
        return;
    }

    if (!gl.getExtension('EXT_color_buffer_float')) {
        console.error('Floating point textures are not supported on this device.');
        alert('This feature requires floating point texture support, which is not available on this device.');
        return;
    }

    const sdfInjected = sdfEvalShader.replace('float map(vec3 pos){}', sdf);
    const fullShader =  preFrag + sdfInjected;

    const program = createProgram(gl, getVertexShader(gl), createShader(gl, gl.FRAGMENT_SHADER, fullShader));

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const sliceLocation = gl.getUniformLocation(program, "u_slice");
    const bboxMinLocation = gl.getUniformLocation(program, "u_bbox_min");
    const bboxMaxLocation = gl.getUniformLocation(program, "u_bbox_max");

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [ -1, -1, 1, -1, -1,  1, -1,  1, 1, -1, 1,  1 ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0 );

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, texture);
    
    //gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, resolution, resolution, resolution, 0, gl.RGBA, gl.HALF_FLOAT, null);
    //
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F, resolution, resolution, resolution, 0, gl.RED, gl.HALF_FLOAT, null);
    
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, resolution, resolution);

    const data = new Float16Array(resolution * resolution * resolution);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform3f(resolutionLocation, resolution, resolution, resolution);
    gl.uniform3fv(bboxMinLocation, boundingBox.min);
    gl.uniform3fv(bboxMaxLocation, boundingBox.max);

    for (let i = 0; i < resolution; i++) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture, 0, i);
        gl.uniform3f(sliceLocation, i / (resolution - 1), 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //const sliceData = new Float32Array(resolution * resolution); 
        const sliceData = new Uint16Array(resolution * resolution); 
        gl.readPixels(0, 0, resolution, resolution, gl.RED, gl.HALF_FLOAT, sliceData);

        for (let j = 0; j < resolution * resolution; j++) {
            //data[i * resolution * resolution + j] = sliceData[j]//halfFloatToFloat(sliceData[j * 4]);
            data[i * resolution * resolution + j] = halfFloatToFloat(sliceData[j]);
        }
    }
    console.log("data",data)
    
    const df = (x, y, z) => {
        const bbox_size = [
            boundingBox.max[0] - boundingBox.min[0],
            boundingBox.max[1] - boundingBox.min[1],
            boundingBox.max[2] - boundingBox.min[2]
        ];

        const gx = (x - boundingBox.min[0]) / bbox_size[0] * (resolution - 1);
        const gy = (y - boundingBox.min[1]) / bbox_size[1] * (resolution - 1);
        const gz = (z - boundingBox.min[2]) / bbox_size[2] * (resolution - 1);

        // Get integer and fractional parts of the grid coordinates
        const ix = Math.floor(gx);
        const iy = Math.floor(gy);
        const iz = Math.floor(gz);

        // Boundary check
        if (ix < 0 || ix >= resolution - 1 || iy < 0 || iy >= resolution - 1 || iz < 0 || iz >= resolution - 1) {
            return 1.0; // Return a value indicating "outside"
        }

        const fx = gx - ix;
        const fy = gy - iy;
        const fz = gz - iz;

        // Trilinear interpolation using the grid coordinates
        const c000 = data[iz * resolution * resolution + iy * resolution + ix];
        const c100 = data[iz * resolution * resolution + iy * resolution + ix + 1];
        const c010 = data[iz * resolution * resolution + (iy + 1) * resolution + ix];
        const c110 = data[iz * resolution * resolution + (iy + 1) * resolution + ix + 1];
        const c001 = data[(iz + 1) * resolution * resolution + iy * resolution + ix];
        const c101 = data[(iz + 1) * resolution * resolution + iy * resolution + ix + 1];
        const c011 = data[(iz + 1) * resolution * resolution + (iy + 1) * resolution + ix];
        const c111 = data[(iz + 1) * resolution * resolution + (iy + 1) * resolution + ix + 1];

        const c00 = c000 * (1 - fx) + c100 * fx;
        const c01 = c001 * (1 - fx) + c101 * fx;
        const c10 = c010 * (1 - fx) + c110 * fx;
        const c11 = c011 * (1 - fx) + c111 * fx;

        const c0 = c00 * (1 - fy) + c10 * fy;
        const c1 = c01 * (1 - fy) + c11 * fy;

        return c0 * (1 - fz) + c1 * fz;
    };

    const bounds = [
        [boundingBox.min[0], boundingBox.min[1], boundingBox.min[2]],
        [boundingBox.max[0], boundingBox.max[1], boundingBox.max[2]]
    ];
    console.log(data);
    console.log(bounds);
    console.log(df(1.0,1.0,1.0));
    var result = mc.marchingCubes(resolution, df, bounds);
    console.log(result);
    return result;
}

const dataView = new DataView(new ArrayBuffer(4));

function halfFloatToFloat(halfFloat) {
    const sign = (halfFloat & 0x8000) >> 15;
    const exponent = (halfFloat & 0x7C00) >> 10;
    const fraction = halfFloat & 0x03FF;

    if (exponent === 0) {
        return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / 1024);
    } else if (exponent === 0x1F) {
        return fraction ? NaN : ((sign ? -1 : 1) * Infinity);
    }

    const newExponent = exponent - 15 + 127;
    const newFraction = fraction << 13;

    const floatBits = (sign << 31) | (newExponent << 23) | newFraction;
    dataView.setUint32(0, floatBits);
    return dataView.getFloat32(0);
}


function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error('Shader compilation error in marchingcubes.js:');
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function getVertexShader(gl) {
    const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
    return createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
}
