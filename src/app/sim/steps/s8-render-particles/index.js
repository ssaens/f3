import render_vsrc from './shaders/render.vert';
import render_fsrc from './shaders/render.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => new (class PredPos {
  init() {
    const render_prog = new Program(gl, 'render', render_vsrc, render_fsrc, {
      attrs: ['a_id'],
      uniforms: ['u_num_particles', 'u_pos_buf', 'u_radius', 'u_t', 'u_mouse']
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    render_prog.set_attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0);

    render_prog.use();
    gl.uniform1i(render_prog.uniforms.u_pos_buf, 0);
    gl.uniform1f(render_prog.uniforms.u_radius, app.is_mac ? sim.particle_radius * 2 : sim.particle_radius);
    gl.uniform1ui(render_prog.uniforms.u_num_particles, sim.num_particles);
    render_prog.unuse();

    this.render_prog = render_prog;
  }

  exec() {
    const { canvas, input, is_mac, renderer } = app;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.activeTexture(gl.TEXTURE0);
    sim.textures.pos.bind();

    this.render_prog.use();
    gl.uniform1f(this.render_prog.uniforms.u_t, renderer.t_curr);
    if (is_mac)
      gl.uniform2f(this.render_prog.uniforms.u_mouse, 2 * input.mouse.x / canvas.width, 2 * input.mouse.y / canvas.height);
    else
      gl.uniform2f(this.render_prog.uniforms.u_mouse, input.mouse.x / canvas.width, input.mouse.y / canvas.height);

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    this.render_prog.unuse();
  }
});
