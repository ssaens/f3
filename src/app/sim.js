import { Program, Texture, to_half } from '~/src/gl-util';
import vertSrc from '~/glsl/pbd.vert';
import fragSrc from '~/glsl/pbd.frag';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.info = {};
    this.textures = {};
    this.framebuffer = null;
    this.framebuffers = [];

    this.next_id;

    const position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);

    const positions = new Float32Array([
      -0.5,  0.5,
      0.5,  0.5,
      -0.5,  -0.5,
      0.5,  -0.5,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.program = new Program(gl, 'basic', vertSrc, fragSrc, {
      attrs: ['in_pos'],
      uniforms: ['t', 'radius', 'mouse', 'position_buffer']
    });

    this.program.use();
    gl.uniform1f(this.program.uniforms.radius, app.is_mac ? 100 : 50);

    this.program.set_attr('in_pos', 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.program.unuse();

    this.init();
  }

  init() {
    const positions = new Uint16Array([
      to_half(1), 0, 0, 0, to_half(1), 0, 0, 0, to_half(1), to_half(1), to_half(1), to_half(1)
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
    gl.uniform1i(this.program.uniforms.position_buffer, 0);
    this.program.unuse();
  }

  generate_particles(w, h) {
    const positions = [];
    const ids = [];
    for (let x = -w / 2; x < w / 2; ++x) {
      for (let y = -h / 2; y < h / 2; ++y) {
        positions.push(x, y);
        ids.push(++this.next_id);
      }
    }
  }

  step(dt) {

  }

  render() {
    const { canvas, input, is_mac, renderer } = app;
    gl.viewport(0, 0, canvas.width, canvas.height);

    this.program.use();
    gl.uniform1f(this.program.uniforms.t, renderer.t_curr);
    if (is_mac)
      gl.uniform2f(this.program.uniforms.mouse, 2 * input.mouse.x / canvas.width, 2 * input.mouse.y / canvas.height);
    else
      gl.uniform2f(this.program.uniforms.mouse, input.mouse.x / canvas.width, input.mouse.y / canvas.height);

    gl.drawArrays(gl.POINTS, 0, 4);
    this.program.unuse();
  }
};
