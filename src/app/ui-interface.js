export default class InfoBox {
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

    this.div = div;
    this._info = {};
  }

  get info() {
    return this._info;
  }

  set info(i) {
    this._info = i;
    this.div.innerHTML = `<pre>${JSON.stringify(i, null, 2)}</pre>`;
  }
}
