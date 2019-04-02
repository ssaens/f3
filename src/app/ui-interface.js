export default app => class InfoBox {
  constructor() {
    const div = document.createElement('div');
    div.setAttribute('id', 'info-box');

    div.style.position = 'fixed';
    div.style.top = 0;
    div.style.left = 0;
    div.style.border = '1px solid white';
    div.style.color = 'white';
    div.style.padding = '0.4em';
    div.style.fontSize = '0.8em';

    document.body.appendChild(div);

    const button = document.createElement('button');
    button.innerHTML = 'pause';
    button.setAttribute('id', 'pause');
    div.appendChild(button);

    const info = document.createElement('div');
    div.appendChild(info);

    this.div = div;
    this.button = button;
    this.info_elem = info;
    this._info = {};

    this.on_button = this.on_button.bind(this);
    button.addEventListener('click', this.on_button);
  }

  on_button() {
    if (app.paused) {
      this.button.innerHTML = 'pause';
      app.run();
    } else {
      this.button.innerHTML = 'resume';
      app.pause();
    }
  }

  get info() {
    return this._info;
  }

  set info(i) {
    this._info = i;
    this.info_elem.innerHTML = `<pre>${JSON.stringify(i, null, 2)}</pre>`;
  }
}
