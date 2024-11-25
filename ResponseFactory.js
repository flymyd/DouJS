export class ResponseFactory {
  constructor() {
    this.response = {
      code: 0,
      msg: '',
      type: '',
      data: null
    };
  }

  success(type, data = null, msg = 'success') {
    this.response.code = 1;
    this.response.msg = msg;
    this.response.type = type;
    this.response.data = data;
    return this;
  }

  error(type, msg = 'error', data = null) {
    this.response.code = 0;
    this.response.msg = msg;
    this.response.type = type;
    this.response.data = data;
    return this;
  }

  custom(code, msg, type, data) {
    this.response.code = code;
    this.response.msg = msg;
    this.response.type = type;
    this.response.data = data;
    return this;
  }

  serialize() {
    return JSON.stringify(this.response);
  }

  getResponse() {
    return this.response;
  }
}
