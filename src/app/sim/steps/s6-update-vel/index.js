import vel_update_vsrc from './shaders/update-vel.vert';
import vel_update_fsrc from './shaders/update-vel.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => (() => {

  let _vel_update_prog;

  function init() {
    _vel_update_prog = new Program(gl, 'vel-update', vel_update_vsrc, vel_update_fsrc, {
      attrs: ['a_id'],
      uniforms: {
        u_num_particles: '1ui',
        u_pos_buf: '1i',
        u_pred_pos_buf: '1i'
      }
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    _vel_update_prog.attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0)
      .use()
      .uniform('u_pos_buf', 0)
      .uniform('u_pred_pos_buf', 1)
      .uniform('u_num_particles', sim.num_particles)
      .unuse();
  }

  function exec() {
    const fb = sim.swap_fbo();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sim.textures.vel._tex, 0);

    gl.activeTexture(gl.TEXTURE0);
    sim.textures.pos.bind();
    gl.activeTexture(gl.TEXTURE1);
    sim.textures.pred_pos.bind();

    _vel_update_prog.use();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, sim.num_particles, 1);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    _vel_update_prog.unuse();

    // const p = new Uint16Array(sim.num_particles * 2);
    // gl.readPixels(0, 0, sim.num_particles, 1, gl.RG, gl.HALF_FLOAT, p);
    // console.log('vel', p[0], p[1]);
  }

  return {
    init,
    exec
  };
})();
