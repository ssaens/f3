export class Texture {
  constructor(gl, ...args) {
    this.gl = gl;
    this._tex = gl.createTexture();
    this.bind();
    gl.texImage2D(gl.TEXTURE_2D, ...args);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  bind() {
    const { gl, _tex } = this;
    gl.bindTexture(gl.TEXTURE_2D, _tex);
  }

  unbind() {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

class Shader {
  static load(gl, type, source) {
    const id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);

    if (gl.getShaderParameter(id, gl.COMPILE_STATUS))
      return id;

    const log = gl.getShaderInfoLog(id);
    gl.deleteShader(id);
    throw new Error(`An error occurred compiling a shader: ${log}`);
  }
}

export class Program {
  constructor(gl, name, vertSrc, fragSrc, inputs) {
    this.name = name;
    this.vert = Shader.load(gl, gl.VERTEX_SHADER, vertSrc);
    this.frag = Shader.load(gl, gl.FRAGMENT_SHADER, fragSrc);

    const pid = gl.createProgram();
    gl.attachShader(pid, this.vert);
    gl.attachShader(pid, this.frag);
    gl.linkProgram(pid);

    if (!gl.getProgramParameter(pid, gl.LINK_STATUS))
      throw new Error(`Unable to link the shader program ${name}: ${gl.getProgramInfoLog(pid)}`);

    this.attrs = {};
    this.uniforms = {};

    inputs.attrs && inputs.attrs.forEach(attr => {
      this.attrs[attr] = gl.getAttribLocation(pid, attr);
      if (this.attrs[attr] === -1)
        console.warn(`shader attribute ${attr} in program ${name} not found`);
    });

    inputs.uniforms && inputs.uniforms.forEach(uniform => {
      this.uniforms[uniform] = gl.getUniformLocation(pid, uniform);
      if (this.uniforms[uniform] === -1)
        console.warn(`shader uniform ${uniform} in program ${name} not found`);
    });

    this.typeToUniformFuncMap = Program.buildTypeToUniformFuncMap(gl);
    this.gl = gl;
    this.pid = pid;
  }

  setAttr(name, ...args) {
    const i = this.attrs[name];
    if (typeof i === 'undefined')
      return false;

    this.gl.vertexAttribPointer(i, ...args);
    this.gl.enableVertexAttribArray(i);
  }

  setUniform(name, ...args) {
    this.use();

    const { gl, typeToUniformFuncMap, uniforms } = this;
    const i = uniforms[name];
    if (typeof i === 'undefined')
      return false;

    const type = gl.getActiveUniform(this.pid, i);
    typeToUniformFuncMap[type](...args);
    this.unuse();
  }

  use() {
    this.gl.useProgram(this.pid);
  }

  unuse() {
    this.gl.useProgram(null);
  }

  static buildTypeToUniformFuncMap(gl) {
    // return {
    //   [gl.FLOAT],
    //   [gl.FLOAT_VEC2],
    //   [gl.FLOAT_VEC3],
    //   [gl.FLOAT_VEC4],
    //   [gl.INT],
    //   [gl.INT_VEC2],
    //   [gl.INT_VEC3],
    //   [gl.INT_VEC4],
    //   [gl.BOOL],
    //   [gl.BOOL_VEC2],
    //   [gl.BOOL_VEC3],
    //   [gl.BOOL_VEC4],
    //   [gl.FLOAT_MAT2],
    //   [gl.FLOAT_MAT3],
    //   [gl.FLOAT_MAT4],
    //   [gl.SAMPLER_2D],
    //   [gl.SAMPLER_CUBE],
    //   [gl.UNSIGNED_INT],
    //   [gl.UNSIGNED_INT_VEC2],
    //   [gl.UNSIGNED_INT_VEC3],
    //   [gl.UNSIGNED_INT_VEC4],
    //   [gl.FLOAT_MAT2x3],
    //   [gl.FLOAT_MAT2x4],
    //   [gl.FLOAT_MAT3x2],
    //   [gl.FLOAT_MAT3x4],
    //   [gl.FLOAT_MAT4x2],
    //   [gl.FLOAT_MAT4x3],
    //   [gl.SAMPLER_2D],
    //   [gl.SAMPLER_3D],
    //   [gl.SAMPLER_CUBE],
    //   [gl.SAMPLER_2D_SHADOW],
    //   [gl.SAMPLER_2D_ARRAY],
    //   [gl.SAMPLER_2D_ARRAY_SHADOW],
    //   [gl.SAMPLER_CUBE_SHADOW],
    //   [gl.INT_SAMPLER_2D],
    //   [gl.INT_SAMPLER_3D],
    //   [gl.INT_SAMPLER_CUBE],
    //   [gl.INT_SAMPLER_2D_ARRAY],
    //   [gl.UNSIGNED_INT_SAMPLER_2D],
    //   [gl.UNSIGNED_INT_SAMPLER_3D],
    //   [gl.UNSIGNED_INT_SAMPLER_CUBE],
    //   [gl.UNSIGNED_INT_SAMPLER_2D_ARRAY]
    // }
  }
}

/**
 * ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
 */
export const toHalf = (function() {

   var floatView = new Float32Array(1);
   var int32View = new Int32Array(floatView.buffer);

   /* This method is faster than the OpenEXR implementation (very often
    * used, eg. in Ogre), with the additional benefit of rounding, inspired
    * by James Tursa?s half-precision code. */
   return function toHalf(val) {

     floatView[0] = val;
     var x = int32View[0];

     var bits = (x >> 16) & 0x8000; /* Get the sign */
     var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
     var e = (x >> 23) & 0xff; /* Using int is faster here */

     /* If zero, or denormal, or exponent underflows too much for a denormal
      * half, return signed zero. */
     if (e < 103) {
       return bits;
     }

     /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
     if (e > 142) {
       bits |= 0x7c00;
       /* If exponent was 0xff and one mantissa bit was set, it means NaN,
        * not Inf, so make sure we set one mantissa bit too. */
       bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
       return bits;
     }

     /* If exponent underflows but not too much, return a denormal */
     if (e < 113) {
       m |= 0x0800;
       /* Extra rounding may overflow and set mantissa to 0 and exponent
        * to 1, which is OK. */
       bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
       return bits;
     }

     bits |= ((e - 112) << 10) | (m >> 1);
     /* Extra rounding. An overflow will set mantissa to 0 and increment
      * the exponent, which is OK. */
     bits += m & 1;
     return bits;
   };

}());