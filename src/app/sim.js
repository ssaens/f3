import { Program, Texture, to_half } from '~/src/gl-util';
import vertSrc from '~/glsl/pbd.vert';
import fragSrc from '~/glsl/pbd.frag';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.info = {};
    this.textures = {};
    this.framebuffer = null;
    this.framebuffers = [];

    this.next_id = -1;
    this.particles = [];
    this.textures = {
      pos: null,
      vel: null,
      pred_pos: null,
      temp: null,
      density_lambda: null
    };

    this.init();
  }

  init() {
    const positions = this.generate_particles();

    this.init_programs();
    this.init_textures(positions);

    this.program.use();
    gl.uniform1f(this.program.uniforms.radius, app.is_mac ? 100 : 50);
    gl.uniform1i(this.program.uniforms.pos_buf, 0);
    gl.uniform1ui(this.program.uniforms.num_particles, this.num_particles);

    const particle_id_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particle_id_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(this.particles), gl.STATIC_DRAW);
    this.program.set_attr('id', 1, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.program.unuse();

  }

  init_programs() {
    this.program = new Program(gl, 'basic', vertSrc, fragSrc, {
      attrs: ['id'],
      uniforms: ['t', 'radius', 'mouse', 'pos_buf', 'num_particles']
    });
  }

  init_textures(positions) {
    const pos = new Texture(gl, 0, 
                            gl.RG16F, 
                            5, 1, 
                            0, 
                            gl.RG, gl.HALF_FLOAT, 
                            new Uint16Array(positions.map(to_half)));

    this.textures.pos = pos;

    gl.activeTexture(gl.TEXTURE0);
    pos.bind();
  }

  generate_particles(w, h) {
    // const positions = [];
    // for (let x = -w / 2; x < w / 2; ++x) {
    //   for (let y = -h / 2; y < h / 2; ++y) {
    //     positions.push(x, y);
    //     this.particles.push(++this.next_id);
    //   }
    // }
    this.particles.push(0, 1, 2, 3, 4);
    return [-0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0, 0];
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

    gl.drawArrays(gl.POINTS, 0, this.num_particles);
    this.program.unuse();
  }

  get num_particles() {
    return this.particles.length;
  }
};
