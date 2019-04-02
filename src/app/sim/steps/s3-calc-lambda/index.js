import calc_lambda_vsrc from './shaders/calc-lambda.vert';
import calc_lambda_fsrc from './shaders/calc-lambda.frag';
import { Program } from '~/src/gl-util';

export default (gl, app, sim) => {

  let _calc_lambda_prog;

  function init() {
    _calc_lambda_prog = new Program(gl, 'calc-lambda', calc_lambda_vsrc, calc_lambda_fsrc, {
      attrs: ['a_id'],
      uniforms: {
        u_num_particles: '1ui'
      }
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, sim.buffers.particle_ids);
    _calc_lambda_prog.attr('a_id', 1, gl.UNSIGNED_SHORT, false, 0, 0)
      .use()
      // .uniform('u_pos_buf', 0)
      // .uniform('u_vel_buf', 1)
      .uniform('u_num_particles', sim.num_particles)
      .unuse();
  }

  function exec() {

  }

  return {
    init,
    exec
  };
};
