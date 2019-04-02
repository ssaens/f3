import calc_lambda_vsrc from './shaders/calc-lambda.vert';
import calc_lambda_fsrc from './shaders/calc-lambda.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => {

  let _calc_lambda_prog;

  function init() {
    _calc_lambda_prog = new Program(gl, 'calc-lambda', calc_lambda_vsrc, calc_lambda_fsrc, {
      attrs: ['a_id'],
      uniforms: {
        u_num_particles: '1ui',
        u_kernel_r: '1f',
        u_rest_density: '1f',
        u_relaxation: '1f'
      }
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    _calc_lambda_prog.attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0)
      .use()
      .uniform('u_num_particles', sim.num_particles)
      .uniform('u_kernel_r', sim.s_params.kernel_r)
      .uniform('u_rest_density', sim.s_params.rest_density)
      .uniform('u_relaxation', sim.s_params.relaxation)
      .unuse();
  }

  function exec() {
    const fb = sim.swap_fbo();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sim.textures.den._tex, 0);

    _calc_lambda_prog.use();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, sim.num_particles, 1);
    gl.drawArrays(gl.POINTS, 0, sim.num_particles);
    _calc_lambda_prog.unuse();
  }

  return {
    init,
    exec
  };
};
