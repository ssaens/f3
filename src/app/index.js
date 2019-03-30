import InputManager from './input-manager';
import PBDSimulation from './sim';
import InfoBox from './ui-interface';
import Renderer from './renderer';

export default class PBDApplication {
  constructor(canvas) {
    this.canvas = document.getElementById(canvas);
    if (!this.canvas)
      throw new Error('canvas element not found');

    this.initialized = false;
    this.paused = true;
    this.isMac = /mac/i.test(window.navigator.platform);

    this.gl = null;
    this.sim = null;
    this.renderer = null;

    this.input = new InputManager();
    this.infoBox = new InfoBox();

    this.samplePerformance = this.samplePerformance.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.input.on('mousemove', this.onMouseMove);
  }

  init() {
    this.infoBox.info = { state: 'initializing...' };

    const gl = this.canvas.getContext("webgl2");
    if (!gl)
      throw new Error('webgl context could not be created');

    this.gl = gl;
    
    this.sim = new (PBDSimulation(this, gl))();
    this.renderer = new (Renderer(this, gl))();

    this.renderer.init();
    this.renderer.on_resize();

    this.initialized = true;
    this.info = { state: 'initialized' };
  }

  onMouseMove(input) {
    this.info = {
      ...this.info,
      mouse: `${input.mouse.x}, ${input.mouse.y}`
    };
  }

  run() {
    if (!this.initialized)
      throw new Error('application has not been initialized');

    this.paused = false;
    this.info = { 
      ...this.info,
      state: 'running'
    };

    this.renderer.start();

    window.setTimeout(this.samplePerformance, 1000);
  }

  samplePerformance() {
    if (!this.renderer.running)
      return;

    const dt = this.t - this.tLast;
    this.info = { 
      ...this.info,
      fps: `${this.renderer.avg_fps.toFixed(2)} fps`
    };

    window.setTimeout(this.samplePerformance, 1000);
  }

  pause() {
    this.info = { 
      ...this.info,
      state: 'paused'
    };
    delete this.info.fps;
    this.renderer.pause();
  }

  get info() {
    return this.infoBox.info;
  }

  set info(info) {
    this.infoBox.info = info;
  }
}