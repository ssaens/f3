import { Texture, to_half } from '~/src/gl-util';
import s1_pred_pos from './steps/s1-pred-pos';
import s2_jank_frnn from './steps/s2-jank-frnn';
import s3_calc_lambda from './steps/s3-calc-lambda';
import s6_update_vel from './steps/s6-update-vel';
import s7_update_pos from './steps/s7-update-pos';
import s8_render_particles from './steps/s8-render-particles';

export default (app, gl) => class PBDSimulation {
  constructor(opts={}) {
    this.next_id = -1;
    this.particles = [];
    this.params_dirty = false;

    this.framebuffer = 1;
    this.framebuffers = [];

    this.s_params = {
      dt: 0.0083,
      kernel_r: 0.1,
      bin_size: 0.1,
      rest_density: 7000,
      relaxation: 800,
      s_corr_dq_mult: 0,
      s_corr_k: 0.0005,
      s_corr_n: 4,
      vort_eps: 0.00017,
      visc_c: 0.000001,
      x_bins: 0,
      y_bins: 0,
      num_bins: 0
    };

    this.r_params = {
      height: 2,
      width: 4,
      radius: 0.1
    };

    this.buffers = {
      particle_ids: null
    };

    this.textures = {
      pos: null,                // position
      vel: null,                // velocity 
      pred_pos: null,           // predicted position
      den: null,                // density lambda
      temp: null,               // temporary storage
      bins: null,               // particle ids sorted by bin id
      bin_start: null,          // bin id -> index in `bin` texture
      bin_count: null           // bin id -> number of entries in bin
    };
    
    this.steps = {
      pred_pos: s1_pred_pos(gl, app, this),
      jank_frnn: s2_jank_frnn(gl, app, this),
      calc_lambda: s3_calc_lambda(gl, app, this),
      update_vel: s6_update_vel(gl, app, this),
      update_pos: s7_update_pos(gl, app, this),
      render_particles: s8_render_particles(gl, app, this)
    }

    this.init();
  }

  init() {
    this.compute_bounds();
    const positions = this.generate_particles({ 
      o_x: this.r_params.width / 2, 
      o_y: this.r_params.height / 2, 
      d_x: 20, d_y: 10 
    });

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

    for (let i = -num_w_particles / 2; i < num_w_particles / 2; ++i) {
      for (let j = -num_h_particles / 2; j < num_h_particles / 2; ++j) {
        let cell = 0;
        positions.push(o_x + i * offset_x, o_y + j * offset_y);
        this.particles.push(++this.next_id);
      }
    }

    return positions;
  }

  compute_bounds() {
    const { bin_size } = this.s_params;
    const { height, width } = this.r_params;

    const y_bins = Math.ceil(height / bin_size);
    const x_bins = Math.ceil(width / bin_size);

    this.s_params.y_bins = y_bins;
    this.s_params.x_bins = x_bins;
    this.s_params.num_bins = y_bins * x_bins;
  }

  init_buffers() {
    this.buffers.particle_ids = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particle_ids);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(this.particles), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  init_programs() {
    this.steps.pred_pos.init();
    this.steps.jank_frnn.init();
    this.steps.calc_lambda.init();
    this.steps.update_vel.init();
    this.steps.update_pos.init();
    this.steps.render_particles.init();
  }

  init_textures(positions) {
    const pos = new Texture(gl, 0, 
                            gl.RG32F, 
                            this.num_particles, 1, 
                            0, 
                            gl.RG, gl.FLOAT, 
                            new Float32Array(positions));

    const vel = new Texture(gl, 0,
                            gl.RG32F,
                            this.num_particles, 1,
                            0,
                            gl.RG, gl.FLOAT,
                            new Float32Array(this.num_particles * 2));

    const pred_pos = new Texture(gl, 0,
                                 gl.RG32F,
                                 this.num_particles, 1,
                                 0,
                                 gl.RG, gl.FLOAT,
                                 null);

    const bins = new Texture(gl, 0,
                             gl.R32UI,
                             this.num_particles, 1,
                             0,
                             gl.RED_INTEGER, gl.UNSIGNED_INT,
                             null);

    const bin_count = new Texture(gl, 0,
                                  gl.R32UI,
                                  this.num_bins, 1,
                                  0,
                                  gl.RED_INTEGER, gl.UNSIGNED_INT,
                                  null);

    const bin_start = new Texture(gl, 0,
                                  gl.R32UI,
                                  this.num_bins, 1,
                                  0,
                                  gl.RED_INTEGER, gl.UNSIGNED_INT,
                                  null);

    const den = new Texture(gl, 0,
                            gl.R32F,
                            this.num_particles, 1,
                            0,
                            gl.RED, gl.FLOAT,
                            null);

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
    this.textures.bins = bins;
    this.textures.bin_count = bin_count;
    this.textures.bin_start = bin_start;
    this.textures.den = den;
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
    if (this.reset_pending) {
      this.reset();
      return;
    }
    this.steps.pred_pos.exec();
    this.steps.jank_frnn.exec();
    this.steps.calc_lambda.exec();
    this.steps.update_vel.exec();
    this.steps.update_pos.exec();
  }

  render() {
    this.steps.render_particles.exec();
  }

  reset() {
    this.next_id = -1;
    this.particles.length = 0;
    const positions = this.generate_particles({ 
      o_x: this.r_params.width / 2, 
      o_y: this.r_params.height / 2, 
      d_x: 20, d_y: 10 
    });

    this.textures.pos.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, 
                  gl.RG32F, 
                  this.num_particles, 1, 
                  0, 
                  gl.RG, gl.FLOAT, 
                  new Float32Array(positions));

    this.textures.vel.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0,
                  gl.RG32F,
                  this.num_particles, 1,
                  0,
                  gl.RG, gl.FLOAT,
                  new Float32Array(this.num_particles * 2));

    this.render();
  }

  get num_particles() {
    return this.particles.length;
  }
};
