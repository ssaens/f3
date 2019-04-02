export default (gl, app, sim) => {

  let _pos_buf;
  let _counts;

  let _bins;
  let _bin_start;
  let _bin_count;

  function bin(x, y) {
    return x < 0 ? 1 : 0;
  }

  function init() {
    _pos_buf = new Float32Array(sim.num_particles * 4);
    _counts = new Uint16Array(sim.num_bins);

    _bins = new Uint32Array(sim.num_particles);
    _bin_start = new Uint32Array(sim.num_bins);
    _bin_count = new Uint32Array(sim.num_bins);
  }

  function exec() {
    const fb = sim.swap_fbo();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sim.textures.pred_pos._tex, 0);
    gl.readPixels(0, 0, sim.num_particles, 1, gl.RGBA, gl.FLOAT, _pos_buf);

    let x;
    let y;
    let b;
    for (let i = 0; i < sim.num_particles * 4; i += 4) {
      x = _pos_buf[i];
      y = _pos_buf[i + 1];
      b = bin(x, y);
      ++_bin_count[b];
    }

    _counts[0] = _bin_count[0];
    _bin_start[0] = 0;
    for (let i = 1; i < sim.num_bins; ++i) {
      _counts[i] = _bin_count[i - 1] + _bin_count[i];
      _bin_start[i] = _bin_start[i - 1] + _bin_count[i - 1];
    }

    for (let i = sim.num_particles - 1; i >= 0; --i) {
      x = _pos_buf[4 * i];
      y = _pos_buf[4 * i + 1];
      b = bin(x, y);
      _bins[--_counts[b]] = i;
    }

    sim.textures.bins.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0,
                  gl.R32UI,
                  this.num_particles, 1,
                  0,
                  gl.RED_INTEGER, gl.UNSIGNED_INT,
                  _bins);

    sim.textures.bin_count.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0,
                  gl.R32UI,
                  this.num_bins, 1,
                  0,
                  gl.RED_INTEGER, gl.UNSIGNED_INT,
                  _bin_count);
    
    sim.textures.bin_start.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0,
                  gl.R32UI,
                  this.num_bins, 1,
                  0,
                  gl.RED_INTEGER, gl.UNSIGNED_INT,
                  _bin_start);
  }

  return {
    init,
    exec
  };
};