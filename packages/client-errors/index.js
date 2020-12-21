/*!
 * client-errors
 * Copyright(c) 2019 Junmin Ahn
 * MIT Licensed
 */

const messages = require('./messages');

/**
 * ES6 Custom Error Class
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */
class ClientError extends Error {
  constructor(statusCode = 400, message, ...others) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message || messages[statusCode] || messages[400], ...others);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientError);
    }

    // Keep track of status code for this error
    this.statusCode = statusCode;
    this.date = new Date();
  }
}

exports.ClientError = ClientError;

/**
 * The server cannot or will not process the request due to something that is perceived to be a client error
 * (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).
 * courtesy of https://httpstatuses.com/400
 */
exports.BadRequestError = class BadRequestError extends ClientError {
  constructor(message, ...others) {
    super(400, message, ...others);
  }
};

/**
 * The request has not been applied becauseit lacks valid authentication credentials for the target resource.
 * courtesy of https://httpstatuses.com/401
 */
exports.UnauthorizedError = class UnauthorizedError extends ClientError {
  constructor(message, ...others) {
    super(401, message, ...others);
  }
};

/**
 * The server understood the request but refuses to authorize it.
 * courtesy of https://httpstatuses.com/403
 */
exports.ForbiddenError = class ForbiddenError extends ClientError {
  constructor(message, ...others) {
    super(403, message, ...others);
  }
};

/**
 * The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.
 * courtesy of https://httpstatuses.com/404
 */
exports.NotFoundError = class NotFoundError extends ClientError {
  constructor(message, ...others) {
    super(404, message, ...others);
  }
};

/**
 * The method received in the request-line is known by the origin server but not supported by the target resource.
 * courtesy of https://httpstatuses.com/405
 */
exports.MethodNotAllowedError = class MethodNotAllowedError extends ClientError {
  constructor(message, ...others) {
    super(405, message, ...others);
  }
};

/**
 * The target resource does not have a current representation that would be acceptable to the user agent,
 * according to the proactive negotiation header fields received in the request,
 * and the server is unwilling to supply a default representation.
 * courtesy of https://httpstatuses.com/406
 */
exports.NotAcceptableError = class NotAcceptableError extends ClientError {
  constructor(message, ...others) {
    super(406, message, ...others);
  }
};

/**
 * Similar to 401 Unauthorized, but it indicates that the client needs to authenticate itself in order to use a proxy.
 * courtesy of https://httpstatuses.com/407
 */
exports.ProxyAuthRequiredError = class ProxyAuthRequiredError extends ClientError {
  constructor(message, ...others) {
    super(407, message, ...others);
  }
};

/**
 * The server did not receive a complete request message within the time that it was prepared to wait.
 * courtesy of https://httpstatuses.com/408
 */
exports.RequestTimeoutError = class RequestTimeoutError extends ClientError {
  constructor(message, ...others) {
    super(408, message, ...others);
  }
};

/**
 * The request could not be completed due to a conflict with the current state of the target resource.
 * This code is used in situations where the user might be able to resolve the conflict and resubmit the request.
 * courtesy of https://httpstatuses.com/409
 */
exports.ConflictError = class ConflictError extends ClientError {
  constructor(message, ...others) {
    super(409, message, ...others);
  }
};

/**
 * The target resource is no longer available at the origin server and that this condition is likely to be permanent.
 * courtesy of https://httpstatuses.com/410
 */
exports.GoneError = class GoneError extends ClientError {
  constructor(message, ...others) {
    super(410, message, ...others);
  }
};

/**
 * The server refuses to accept the request without a defined Content-Length.
 * courtesy of https://httpstatuses.com/411
 */
exports.LengthRequiredError = class LengthRequiredError extends ClientError {
  constructor(message, ...others) {
    super(411, message, ...others);
  }
};

/**
 * One or more conditions given in the request header fields evaluated to false when tested on the server.
 * courtesy of https://httpstatuses.com/412
 */
exports.PreconditionFailedError = class PreconditionFailedError extends ClientError {
  constructor(message, ...others) {
    super(412, message, ...others);
  }
};

/**
 * The server is refusing to process a request because the request payload is larger than the server is willing or able to process.
 * courtesy of https://httpstatuses.com/413
 */
exports.PayloadTooLargeError = class PayloadTooLargeError extends ClientError {
  constructor(message, ...others) {
    super(413, message, ...others);
  }
};

/**
 * The server is refusing to service the request because the request-target is longer than the server is willing to interpret.
 * courtesy of https://httpstatuses.com/414
 */
exports.UriTooLongError = class UriTooLongError extends ClientError {
  constructor(message, ...others) {
    super(414, message, ...others);
  }
};

/**
 * The origin server is refusing to service the request because the payload is in a format not supported by this method on the target resource.
 * courtesy of https://httpstatuses.com/415
 */
exports.UnsupportedMediaTypeError = class UnsupportedMediaTypeError extends ClientError {
  constructor(message, ...others) {
    super(415, message, ...others);
  }
};

/**
 * None of the ranges in the request's Range header field overlap the current extent of the selected resource or
 * that the set of ranges requested has been rejected due to invalid ranges or an excessive request of small or overlapping ranges.
 * courtesy of https://httpstatuses.com/416
 */
exports.RequestedRangeNotSatisfiableError = class RequestedRangeNotSatisfiableError extends ClientError {
  constructor(message, ...others) {
    super(416, message, ...others);
  }
};

/**
 * The expectation given in the request's Expect header field could not be met by at least one of the inbound servers.
 * courtesy of https://httpstatuses.com/417
 */
exports.ExpectationFailedError = class ExpectationFailedError extends ClientError {
  constructor(message, ...others) {
    super(417, message, ...others);
  }
};

/**
 * Any attempt to brew coffee with a teapot should result in the error code "418 I'm a teapot".
 * The resulting entity body MAY be short and stout.
 * courtesy of https://httpstatuses.com/418
 */
exports.TeapotError = class TeapotError extends ClientError {
  constructor(message, ...others) {
    super(418, message, ...others);
  }
};

/**
 * The request was directed at a server that is not able to produce a response.
 * This can be sent by a server that is not configured to produce responses for
 * the combination of scheme and authority that are included in the request URI.
 * courtesy of https://httpstatuses.com/421
 */
exports.MisdirectedRequestError = class MisdirectedRequestError extends ClientError {
  constructor(message, ...others) {
    super(421, message, ...others);
  }
};

/**
 * The server understands the content type of the request entity (hence a 415 Unsupported Media Type status code is inappropriate),
 * and the syntax of the request entity is correct (thus a 400 Bad Request status code is inappropriate) but was unable to process the contained instructions.
 * courtesy of https://httpstatuses.com/422
 */
exports.UnprocessableEntityError = class UnprocessableEntityError extends ClientError {
  constructor(message, ...others) {
    super(422, message, ...others);
  }
};

/**
 * The source or destination resource of a method is locked.
 * courtesy of https://httpstatuses.com/423
 */
exports.LockedError = class LockedError extends ClientError {
  constructor(message, ...others) {
    super(423, message, ...others);
  }
};

/**
 * The method could not be performed on the resource because the requested action depended on another action and that action failed.
 * courtesy of https://httpstatuses.com/424
 */
exports.FailedDependencyError = class FailedDependencyError extends ClientError {
  constructor(message, ...others) {
    super(424, message, ...others);
  }
};

/**
 * The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.
 * courtesy of https://httpstatuses.com/426
 */
exports.UpgradeRequiredError = class UpgradeRequiredError extends ClientError {
  constructor(message, ...others) {
    super(426, message, ...others);
  }
};

/**
 * The origin server requires the request to be conditional.
 * courtesy of https://httpstatuses.com/428
 */
exports.PreconditionRequiredError = class PreconditionRequiredError extends ClientError {
  constructor(message, ...others) {
    super(428, message, ...others);
  }
};

/**
 * The user has sent too many requests in a given amount of time ("rate limiting").
 * courtesy of https://httpstatuses.com/429
 */
exports.TooManyRequestsError = class TooManyRequestsError extends ClientError {
  constructor(message, ...others) {
    super(429, message, ...others);
  }
};

/**
 * The server is unwilling to process the request because its header fields are too large.
 * The request MAY be resubmitted after reducing the size of the request header fields.
 * courtesy of https://httpstatuses.com/431
 */
exports.RequestHeaderFieldsTooLargeError = class RequestHeaderFieldsTooLargeError extends ClientError {
  constructor(message, ...others) {
    super(431, message, ...others);
  }
};

/**
 * The server is denying access to the resource as a consequence of a legal demand.
 * courtesy of https://httpstatuses.com/451
 */
exports.UnavailableForLegalReasonsError = class UnavailableForLegalReasonsError extends ClientError {
  constructor(message, ...others) {
    super(451, message, ...others);
  }
};
