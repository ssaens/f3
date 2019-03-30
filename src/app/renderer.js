/**
 * Render Loop Manager
 */
export default (app, gl) => class Renderer { 
  constructor() {
    this.running = false;
    this.avg_fps = 0;
    this.t_curr = 0;
    this.t_last = 0;

    this.on_frame = this.on_frame.bind(this);
    this.on_resize = this.on_resize.bind(this);
  }

  init() {
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    window.addEventListener('resize', this.on_resize);
  }

  start() {
    this.running = true;
    window.requestAnimationFrame(this.on_frame);
  }

  on_frame(t) {
    if (!this.running)
      return;

    this.t_last = this.t_curr;
    this.t_curr = t;
    const dt = t - this.t_last;

    this.avg_fps = (1000 / dt + this.avg_fps) * 0.5;

    app.sim.step(dt);
    app.sim.render();

    window.requestAnimationFrame(this.on_frame);
  }

  on_resize() {
    const { canvas } = app;
    if (app.isMac) {
      canvas.height = 2 * canvas.clientHeight;
      canvas.width = 2 * canvas.clientWidth;
    } else {
      canvas.height = canvas.clientHeight;
      canvas.width = canvas.clientWidth;
    }
  }

  pause() {
    this.running = false;
  }

  destroy() {

  }
};
