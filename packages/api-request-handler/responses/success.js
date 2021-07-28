/*!
 * Successful responses (200–299)
 * Copyright(c) 2021 Junmin Ahn
 * MIT Licensed
 */

const { Response } = require('./index');

/**
 * 200 OK; The request has succeeded.
 * courtesy of https://httpstatuses.com/200
 */
exports.OK = class OK extends Response {
  constructor(data) {
    super(200, data);
  }
};

/**
 * The request has been fulfilled and has resulted in one or more new resources being created.
 * courtesy of https://httpstatuses.com/201
 */
exports.Created = class Created extends Response {
  constructor(data) {
    super(201, data);
  }
};

/**
 * The request has been accepted for processing, but the processing has not been completed.
 * The request might or might not eventually be acted upon,
 * as it might be disallowed when processing actually takes place.
 * courtesy of https://httpstatuses.com/202
 */
exports.Accepted = class Accepted extends Response {
  constructor(data) {
    super(202, data);
  }
};

/**
 * The request was successful but the enclosed payload has been modified from
 * that of the origin server's 200 OK response by a transforming proxy.
 * courtesy of https://httpstatuses.com/203
 */
exports.NonAuthoritativeInfo = class NonAuthoritativeInfo extends Response {
  constructor(data) {
    super(203, data);
  }
};

/**
 * The server has successfully fulfilled the request and that
 * there is no additional content to send in the response payload body.
 * courtesy of https://httpstatuses.com/204
 */
exports.NoContent = class NoContent extends Response {
  constructor(data) {
    super(204, data);
  }
};

/**
 * The server has fulfilled the request and desires that the user agent reset the "document view",
 * which caused the request to be sent, to its original state as received from the origin server.
 * courtesy of https://httpstatuses.com/205
 */
exports.ResetContent = class ResetContent extends Response {
  constructor(data) {
    super(205, data);
  }
};

/**
 * The server is successfully fulfilling a range request for the target resource
 * by transferring one or more parts of the selected representation that
 * correspond to the satisfiable ranges found in the request's Range header field.
 * courtesy of https://httpstatuses.com/206
 */
exports.PartialContent = class PartialContent extends Response {
  constructor(data) {
    super(206, data);
  }
};

/**
 * A Multi-Status response conveys information about multiple resources
 * in situations where multiple status codes might be appropriate.
 * courtesy of https://httpstatuses.com/207
 */
exports.MultiStatus = class MultiStatus extends Response {
  constructor(data) {
    super(207, data);
  }
};

/**
 * Used inside a DAV: propstat response element to avoid enumerating
 * the internal members of multiple bindings to the same collection repeatedly.
 * courtesy of https://httpstatuses.com/208
 */
exports.AlreadyReported = class AlreadyReported extends Response {
  constructor(data) {
    super(208, data);
  }
};

/**
 * The server has fulfilled a GET request for the resource, and the response is
 * a representation of the result of one or more instance-manipulations applied to the current instance.
 * courtesy of https://httpstatuses.com/226
 */
exports.IMUsed = class IMUsed extends Response {
  constructor(data) {
    super(226, data);
  }
};
