import { Program, Texture, toHalf } from '~/src/gl-util';
import vertSrc from '~/glsl/pbd.vert';
import fragSrc from '~/glsl/pbd.frag';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.info = {};
    this.textures = {};
    this.framebuffer = null;
    this.framebuffers = [];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = new Float32Array([
      -0.5,  0.5,
      0.5,  0.5,
      -0.5,  -0.5,
      0.5,  -0.5,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.program = new Program(gl, 'basic', vertSrc, fragSrc, {
      attrs: ['aVertexPosition'],
      uniforms: ['t', 'radius', 'mouse', 'positionBuffer']
    });

    this.program.use();
    gl.uniform1f(this.program.uniforms.radius, app.isMac ? 100 : 50);

    this.program.setAttr('aVertexPosition', 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.program.unuse();

    this.init();
  }

  init() {
    const positions = new Uint16Array([
      toHalf(1), 0, 0, 0, toHalf(1), 0, 0, 0, toHalf(1), toHalf(1), toHalf(1), toHalf(1)
    ]);
    this.posTexture = new Texture(gl,
                                   0,
                                   gl.RGB16F,
                                   4,
                                   1,
                                   0,
                                   gl.RGB,
                                   gl.HALF_FLOAT,
                                   positions);

    this.program.use();
    gl.activeTexture(gl.TEXTURE0);
    this.posTexture.bind();
    gl.uniform1i(this.program.uniforms.positionBuffer, 0);
    this.program.unuse();
  }

  generateParticles(w, h) {
    const positions = [];
    for (let x = -w / 2; x < w / 2; ++x) {
      for (let y = -h / 2; y < h / 2; ++y) {
        positions.push(x, y);
      }
    }
  }

  step(dt) {

  }

  render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const { canvas, input, isMac, renderer } = app;
    gl.viewport(0, 0, canvas.width, canvas.height);

    this.program.use();
    gl.uniform1f(this.program.uniforms.t, renderer.t_curr);
    if (isMac)
      gl.uniform2f(this.program.uniforms.mouse, 2 * input.mouse.x / canvas.width, 2 * input.mouse.y / canvas.height);
    else
      gl.uniform2f(this.program.uniforms.mouse, input.mouse.x / canvas.width, input.mouse.y / canvas.height);

    gl.drawArrays(gl.POINTS, 0, 4);
    this.program.unuse();
  }
};
