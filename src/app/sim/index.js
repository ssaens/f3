import { Program, Texture, to_half } from '~/src/gl-util';
import vertSrc from '~/glsl/pbd.vert';
import fragSrc from '~/glsl/pbd.frag';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.particle_radius = 20;

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
    const positions = this.generate_particles({ d_x: 20 });

    this.init_programs();
    this.init_textures(positions);

    this.program.use();
    gl.uniform1f(this.program.uniforms.radius, app.is_mac ? this.particle_radius * 2 : this.particle_radius);
    gl.uniform1i(this.program.uniforms.pos_buf, 0);
    gl.uniform1ui(this.program.uniforms.num_particles, this.num_particles);

    const particle_id_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particle_id_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(this.particles), gl.STATIC_DRAW);
    this.program.set_attr('id', 1, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.program.unuse();
  }

  generate_particles({ o_x=0, o_y=0, w=1, h=1, d_x=10, d_y=10 }) {
    const positions = [];
    const num_w_particles = w * d_x;
    const num_h_particles = h * d_y;
    const offset_x = w / num_w_particles;
    const offset_y = h / num_h_particles;

    let x;
    let y;
    for (let i = -num_w_particles / 2; i <= num_w_particles / 2; ++i) {
      for (let j = -num_h_particles / 2; j <= num_h_particles / 2; ++j) {
        positions.push(o_x + i * offset_x, o_y + j * offset_y);
        this.particles.push(++this.next_id);
      }
    }

    return positions;
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
                            positions.length / 2, 1, 
                            0, 
                            gl.RG, gl.HALF_FLOAT, 
                            new Uint16Array(positions.map(to_half)));

    this.textures.pos = pos;

    gl.activeTexture(gl.TEXTURE0);
    pos.bind();
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
