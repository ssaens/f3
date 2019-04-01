import { Program, Texture, to_half } from '~/src/gl-util';
import s1_pred_pos from './steps/s1-predict-pos';
import s7_update_pos from './steps/s7-update-pos';
import screen_vert from '~/glsl/screen.vert';
import screen_frag from '~/glsl/screen.frag';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.particle_radius = 16;

    this.info = {};
    this.textures = {};
    this.framebuffer = 1;
    this.framebuffers = [];

    this.next_id = -1;
    this.particles = [];
    this.buffers = {
      particle_ids: null,
      quad_vertices: null
    };
    this.textures = {
      meta: null,
      pos: null,
      vel: null,
      pred_pos: null,
      temp: null,
      density_lambda: null
    };
    
    this.steps = {
      pred_pos: s1_pred_pos(gl, app, this),
      update_pos: s7_update_pos(gl, app, this)
    }

    this.init();
  }

  init() {
    const positions = this.generate_particles({ d_x: 30, d_y: 15 });

    app.info = { ...app.info, particles: this.num_particles };

    this.init_buffers();
    this.init_textures(positions);
    this.init_programs();
    this.init_framebuffers();
  }

  generate_particles({ o_x=0, o_y=0, w=1, h=1, d_x=10, d_y=10 }) {
    const positions = [];
    const num_w_particles = w * d_x;
    const num_h_particles = h * d_y;
    const offset_x = w / num_w_particles;
    const offset_y = h / num_h_particles;

    let x;
    let y;
    for (let i = -num_w_particles / 2; i < num_w_particles / 2; ++i) {
      for (let j = -num_h_particles / 2; j < num_h_particles / 2; ++j) {
        let cell = 0;
        positions.push(o_x + i * offset_x, o_y + j * offset_y);
        this.particles.push(++this.next_id);
      }
    }

    return positions;
  }

  init_buffers() {
    this.buffers.particle_ids = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particle_ids);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(this.particles), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  init_programs() {
    this.steps.pred_pos.init();
    this.steps.update_pos.init();

    this.screen_prog = new Program(gl, 'screen', screen_vert, screen_frag, {
      attrs: ['id'],
      uniforms: ['num_particles', 'pos_buf', 'radius', 't', 'mouse']
    });

    this.screen_prog.set_attr('id', 1, gl.UNSIGNED_SHORT, false, 0, 0);

    this.screen_prog.use();
    gl.uniform1i(this.screen_prog.uniforms.pos_buf, 0);
    gl.uniform1f(this.screen_prog.uniforms.radius, app.is_mac ? this.particle_radius * 2 : this.particle_radius);
    gl.uniform1ui(this.screen_prog.uniforms.num_particles, this.num_particles);
    this.screen_prog.unuse();
  }

  init_textures(positions) {
    const meta = null;

    const pos = new Texture(gl, 0, 
                            gl.RG16F, 
                            this.num_particles, 1, 
                            0, 
                            gl.RG, gl.HALF_FLOAT, 
                            new Uint16Array(positions.map(to_half)));

    const vel = new Texture(gl, 0,
                            gl.RG16F,
                            this.num_particles, 1,
                            0,
                            gl.RG, gl.HALF_FLOAT,
                            new Uint16Array(this.num_particles * 2));

    const pred_pos = new Texture(gl, 0,
                                 gl.RG16F,
                                 this.num_particles, 1,
                                 0,
                                 gl.RG, gl.HALF_FLOAT,
                                 null);

    // const lambdas = [];
    // for (let i = 0; i < this.num_particles; ++i)
    //   lambdas.push(0);

    // const lambda = new Texture(gl, 0,
    //                            gl.R16F,
    //                            this.num_particles, 1,
    //                            0,
    //                            gl.R, gl.HALF_FLOAT,
    //                            new Uint16Array(lambdas));

    // const dp_pre = new Texture(gl, 0,
    //                            gl.RG16F,
    //                            this.num_particles, 1,
    //                            0,
    //                            gl.RG, gl.HALF_FLOAT,
    //                            new Uint16Array(positions.map(() => 0)));

    // const dp_post = new Texture(gl, 0,
    //                             gl.RG16F,
    //                             this.num_particles, 1,
    //                             0,
    //                             gl.RG, gl.HALF_FLOAT,
    //                             new Uint16Array(positions.map(() => 0)));

    // const v_vort = null;

    this.textures.pos = pos;
    this.textures.vel = vel;
    this.textures.pred_pos = pred_pos;
  }

  init_framebuffers() {
    this.framebuffers.push(gl.createFramebuffer());
    this.framebuffers.push(gl.createFramebuffer());
  }

  swap_fbo() {
    this.framebuffer = 1 - this.framebuffer;
    return this.framebuffers[this.framebuffer];
  }

  step(dt) {
    this.steps.pred_pos.exec();    
    this.steps.update_pos.exec();
  }

  render() {
    const { canvas, input, is_mac, renderer } = app;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.activeTexture(gl.TEXTURE0);
    this.textures.pos.bind();

    this.screen_prog.use();
    gl.uniform1i(this.screen_prog.uniforms.pos_buf, 0);
    gl.uniform1f(this.screen_prog.uniforms.t, renderer.t_curr);
    if (is_mac)
      gl.uniform2f(this.screen_prog.uniforms.mouse, 2 * input.mouse.x / canvas.width, 2 * input.mouse.y / canvas.height);
    else
      gl.uniform2f(this.screen_prog.uniforms.mouse, input.mouse.x / canvas.width, input.mouse.y / canvas.height);

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, this.num_particles);
    this.screen_prog.unuse();
  }

  get num_particles() {
    return this.particles.length;
  }
};
