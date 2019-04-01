import pred_pos_vsrc from './shaders/pred-pos.vert';
import pred_pos_fsrc from './shaders/pred-pos.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => new (class PredPos {
  init() {
    const pred_pos_prog = new Program(gl, 'pred_pos', pred_pos_vsrc, pred_pos_fsrc, {
      attrs: ['a_id'],
      uniforms: ['u_num_particles', 'u_pos_buf', 'u_vel_buf']
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    pred_pos_prog.set_attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0);

    pred_pos_prog.use();
    gl.uniform1i(pred_pos_prog.uniforms.u_pos_buf, 0);
    gl.uniform1i(pred_pos_prog.uniforms.u_vel_buf, 1);
    gl.uniform1ui(pred_pos_prog.uniforms.u_num_particles, sim.num_particles);
    pred_pos_prog.unuse();

    this.pred_pos_prog = pred_pos_prog;
  }

  exec() {
    const fb = sim.swap_fbo();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sim.textures.pred_pos._tex, 0);

    gl.activeTexture(gl.TEXTURE0);
    sim.textures.pos.bind();
    gl.activeTexture(gl.TEXTURE1);
    sim.textures.vel.bind();

    this.pred_pos_prog.use();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, sim.num_particles, 1);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    this.pred_pos_prog.unuse();
  }
});
