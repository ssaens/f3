import pos_update_vsrc from '~/glsl/pos-update.vert';
import pos_update_fsrc from '~/glsl/pos-update.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => new (class PositionUpate {
  init() {
    const pos_update_prog = new Program(gl, 'pos_update', pos_update_vsrc, pos_update_fsrc, {
      attrs: ['a_id'],
      uniforms: ['u_num_particles', 'u_pred_pos_buf']
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    pos_update_prog.set_attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0);

    pos_update_prog.use();
    gl.uniform1i(pos_update_prog.uniforms.u_pred_pos_buf, 0);
    gl.uniform1ui(pos_update_prog.uniforms.u_num_particles, sim.num_particles);
    pos_update_prog.unuse();

    this.pos_update_prog = pos_update_prog;
  }

  exec() {
    const fb = sim.swap_fbo();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sim.textures.pos._tex, 0);

    gl.activeTexture(gl.TEXTURE0);
    sim.textures.pred_pos.bind();

    this.pos_update_prog.use();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, sim.num_particles, 1);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    this.pos_update_prog.unuse();
  }
})();
