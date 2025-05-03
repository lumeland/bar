export default class State {
  key = "lume-bar";

  constructor() {
    const restore = localStorage.getItem(this.key);
    this.state = restore ? JSON.parse(restore) : {};
  }

  set(key, value) {
    this.state[key] = value;
    this.save();
  }

  get(key) {
    return this.state[key];
  }

  remove(key) {
    delete this.state[key];
  }

  clear() {
    this.state = {};
    localStorage.removeItem(this.key);
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.state));
  }
}
