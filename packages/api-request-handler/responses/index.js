/*!
 * HTTP Responses
 * Copyright(c) 2021 Junmin Ahn
 * MIT Licensed
 */

exports.Response = class Response {
  constructor(statusCode = 200, data) {
    this.statusCode = statusCode;
    this.data = data;
  }
};
