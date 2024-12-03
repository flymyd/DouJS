export class ResponseFactory {
  constructor() {
    this.code = 0;
    this.msg = '';
    this.data = null;
    this.silent = false;
  }

  success(code, data, msg = '') {
    this.code = 1;
    this.data = data;
    this.msg = msg;
    return this;
  }

  error(code, msg) {
    this.code = 0;
    this.msg = msg;
    return this;
  }

  serialize() {
    return JSON.stringify({
      code: this.code,
      msg: this.msg,
      data: this.data,
      silent: this.silent
    });
  }
}
