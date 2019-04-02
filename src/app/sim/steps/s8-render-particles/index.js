import render_vsrc from './shaders/render.vert';
import render_fsrc from './shaders/render.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => (() => {

  let _render_prog;

  function init() {
    _render_prog = new Program(gl, 'render', render_vsrc, render_fsrc, {
      attrs: ['a_id'],
      uniforms: {
        u_num_particles: '1ui', 
        u_pos_buf: '1i', 
        u_radius: '1f', 
        u_t: '1f', 
        u_mouse: '2f'
      }
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    _render_prog.attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0)
      .use()
      .uniform('u_pos_buf', 0)
      .uniform('u_radius', app.is_mac ? sim.particle_radius * 2 : sim.particle_radius)
      .uniform('u_num_particles', sim.num_particles)
      .unuse();
  }

  function exec() {
    const { canvas, input, is_mac, renderer } = app;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.activeTexture(gl.TEXTURE0);
    sim.textures.pos.bind();

    _render_prog.use()
      .uniform('u_t', renderer.t_curr);
    if (is_mac)
      _render_prog.uniform('u_mouse', 2 * input.mouse.x / canvas.width, 2 * input.mouse.y / canvas.height);
    else
      _render_prog.uniform('u_mouse', input.mouse.x / canvas.width, input.mouse.y / canvas.height);

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    _render_prog.unuse();
  }

  return {
    init,
    exec
  };
})();
