export default class InputManager {
  constructor() {
    this.mouse = {
      x: 0,
      y: 0
    };
    this.keys = new Set();

    this.handlers = {};
    
    this.onClick = this.onClick.bind(this);
    this.onMouse = this.onMouse.bind(this);
    this.onScroll = this.onScroll.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('mousemove', this.onMouse);
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouse);
  }

  on(event, handler) {
    if (!this.handlers[event])
      this.handlers[event] = [];

    this.handlers[event].push(handler);    
  }

  remove(event, handler) {
    if (!this.handlers[event])
      return;

    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  onClick() {

  }

  onMouse(e) {
    this.mouse.x = e.offsetX;
    this.mouse.y = e.offsetY;

    this.handlers['mousemove'].forEach(h => h(this, e));
  }

  onScroll() {

  }
}