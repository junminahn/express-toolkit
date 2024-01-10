/*!
 * api-request-handler
 * Copyright(c) 2019 Junmin Ahn
 * MIT Licensed
 */
const assert = require('assert');
const { Response } = require('./responses');
const {
  OK,
  Created,
  Accepted,
  NonAuthoritativeInfo,
  NoContent,
  ResetContent,
  PartialContent,
  MultiStatus,
  AlreadyReported,
  IMUsed,
} = require('./responses/success');
const { CSVResponse } = require('./responses/csv');
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  NotAcceptableError,
  ProxyAuthRequiredError,
  RequestTimeoutError,
  ConflictError,
  GoneError,
  LengthRequiredError,
  PreconditionFailedError,
  PayloadTooLargeError,
  UriTooLongError,
  UnsupportedMediaTypeError,
  RequestedRangeNotSatisfiableError,
  ExpectationFailedError,
  TeapotError,
  MisdirectedRequestError,
  UnprocessableEntityError,
  LockedError,
  FailedDependencyError,
  UpgradeRequiredError,
  PreconditionRequiredError,
  TooManyRequestsError,
  RequestHeaderFieldsTooLargeError,
  UnavailableForLegalReasonsError,
} = require('client-errors');

/**
 * Helper functions to identify specific types.
 */
const isFunction = (fn) => typeof fn === 'function';
const isString = (val) => typeof val === 'string';
const isPromise = (p) => p && isFunction(p.then);
const promisify = (p) => (isPromise(p) ? p : (a) => Promise.resolve(p(a)));
const { isArray } = Array;

/**
 * Default error message provider to parse errors and get error messages.
 */
const defaultErrorMessageProvider = function (error) {
  return error.message || error._message || error;
};

/**
 * Defined getter & setter of error message provider.
 * Ensures the custom error message provider is a function.
 */
const errorMessageProvider = {
  _provider: null,
  get: function () {
    return errorMessageProvider._provider;
  },
  set: function (fn) {
    assert.ok(isFunction(fn), 'error message provider must be a function');
    errorMessageProvider._provider = fn;
  },
};

/**
 * Send a JSON response with status 200.
 */
const _sendJson = function (res, data, event) {
  if (res.headersSent) return;
  if (event.canceled) return;

  if (data instanceof Response) {
    res.status(data.statusCode).json(data.data);
  } else if (data instanceof CSVResponse) {
    data.streamCsv(res);
  } else {
    res.json(data);
  }
};

/**
 * Send an error message with 4xx response code.
 */
const _sendError = function (res, err, event) {
  if (res.headersSent) return;
  if (event.canceled) return;

  if (err.statusCode) {
    const payload = { message: err.message || '' };
    if (err.errors) payload.errors = err.errors;
    res.status(err.statusCode).send(payload);
  } else {
    const result = errorMessageProvider._provider(err);
    const payload = isString(result) ? { message: result } : { ...result };
    res.status(422).send(payload);
  }
};

let sendJson = _sendJson;
let sendError = _sendError;

/**
 * Set pre-json hook
 */
const preJson = {
  _hook: null,
  get: function () {
    return preJson._hook;
  },
  set: function (fn) {
    assert.ok(isFunction(fn), 'pre-json hook must be a function');
    preJson._hook = promisify(fn);

    if (postJson._hook) {
      sendJson = function (res, data, event) {
        preJson._hook(data).then(() => {
          _sendJson(res, data, event);
          postJson._hook(data);
        });
      };
    } else {
      sendJson = function (res, data, event) {
        preJson._hook(data).then(() => _sendJson(res, data, event));
      };
    }
  },
};

/**
 * Set post-json hook
 */
const postJson = {
  _hook: null,
  get: function () {
    return postJson._hook;
  },
  set: function (fn) {
    assert.ok(isFunction(fn), 'post-json hook must be a function');
    postJson._hook = promisify(fn);

    if (preJson._hook) {
      sendJson = function (res, data, event) {
        preJson._hook(data).then(() => {
          _sendJson(res, data, event);
          postJson._hook(data);
        });
      };
    } else {
      sendJson = function (res, data, event) {
        _sendJson(res, data, event);
        postJson._hook(data);
      };
    }
  },
};

/**
 * Set pre-error hook
 */
const preError = {
  _hook: null,
  get: function () {
    return preError._hook;
  },
  set: function (fn) {
    assert.ok(isFunction(fn), 'pre-error hook must be a function');
    preError._hook = promisify(fn);

    if (postError._hook) {
      sendError = function (res, err, event) {
        preError._hook(err).then(() => {
          _sendError(res, err, event);
          postError._hook(err);
        });
      };
    } else {
      sendError = function (res, err, event) {
        preError._hook(err).then(() => _sendError(res, err, event));
      };
    }
  },
};

/**
 * Set post-error hook
 */
const postError = {
  _hook: null,
  get: function () {
    return postError._hook;
  },
  set: function (fn) {
    assert.ok(isFunction(fn), 'post-error hook must be a function');
    postError._hook = promisify(fn);

    if (preError._hook) {
      sendError = function (res, err, event) {
        preError._hook(err).then(() => {
          _sendError(res, err, event);
          postError._hook(err);
        });
      };
    } else {
      sendError = function (res, err, event) {
        _sendError(res, err, event);
        postError._hook(err);
      };
    }
  },
};

/**
 * Complete a request with a returned promise.
 */
const handlePromise = function (res, promise, event) {
  promise.then(
    (data) => {
      if (event.nextValue) {
        if (event.hasError) sendError(res, event.nextValue, event);
        else sendJson(res, event.nextValue, event);
      } else {
        sendJson(res, data, event);
      }
    },
    (err) => sendError(res, err, event),
  );
};

/**
 * Complete a request with a returned result.
 * The result is either 'Promise' or any type of value.
 */
const handleResult = function (res, result, event) {
  if (res.headersSent) return;
  if (event.canceled) return;

  if (event.nextValue) {
    if (event.hasError) sendError(res, event.nextValue, event);
    else sendJson(res, event.nextValue, event);
  } else if (isPromise(result)) handlePromise(res, result, event);
  else sendJson(res, result, event);
};

/**
 * Return an express next function wrapper and ensure the event is canceled.
 */
const nextFn = function (event, next) {
  return function (...args) {
    if (args.length > 0) {
      event.nextValue = args[0];
      if (args[0] instanceof Error) {
        event.hasError = true;
      } else {
        event.hasValue = true;
      }
    } else {
      event.canceled = true;
      next();
    }
  };
};

/**
 * Return an express router function.
 */
const routerFn = function (fn) {
  return function (req, res, next) {
    const event = { canceled: false, hasError: false, hasValue: false, nextValue: null };

    try {
      const result = fn(req, res, nextFn(event, next));
      handleResult(res, result, event);
    } catch (err) {
      if (res.headersSent) return;
      sendError(res, err, event);
    }
  };
};

/**
 * Handle a response with one or more possible middleware functions.
 * 1. single middleware: handleResponse(fn1)
 * 2. multiple middlewares: handleResponse(fn1, fn2, fn3)
 * 3. multiple middlewares: handleResponse([fn1, fn2, fn3])
 */
const handleResponse = function (...fns) {
  if (fns.length > 1) return fns.map(routerFn);
  if (isArray(fns[0])) return fns[0].map(routerFn);
  return routerFn(fns[0]);
};

//
errorMessageProvider.set(defaultErrorMessageProvider);

module.exports = {
  handleResponse,
  handleResult,
  handlePromise,
  HttpResponse: {
    // 2XX SUCCESS
    OK: (...args) => new OK(...args),
    Created: (...args) => new Created(...args),
    Accepted: (...args) => new Accepted(...args),
    NonAuthoritativeInfo: (...args) => new NonAuthoritativeInfo(...args),
    NoContent: (...args) => new NoContent(...args),
    ResetContent: (...args) => new ResetContent(...args),
    PartialContent: (...args) => new PartialContent(...args),
    MultiStatus: (...args) => new MultiStatus(...args),
    AlreadyReported: (...args) => new AlreadyReported(...args),
    IMUsed: (...args) => new IMUsed(...args),
    // 4XX CLIENT ERROR
    BadRequest: (...args) => new BadRequestError(...args),
    Unauthorized: (...args) => new UnauthorizedError(...args),
    Forbidden: (...args) => new ForbiddenError(...args),
    NotFound: (...args) => new NotFoundError(...args),
    MethodNotAllowed: (...args) => new MethodNotAllowedError(...args),
    NotAcceptable: (...args) => new NotAcceptableError(...args),
    ProxyAuthRequired: (...args) => new ProxyAuthRequiredError(...args),
    RequestTimeout: (...args) => new RequestTimeoutError(...args),
    Conflict: (...args) => new ConflictError(...args),
    Gone: (...args) => new GoneError(...args),
    LengthRequired: (...args) => new LengthRequiredError(...args),
    PreconditionFailed: (...args) => new PreconditionFailedError(...args),
    PayloadTooLarge: (...args) => new PayloadTooLargeError(...args),
    UriTooLong: (...args) => new UriTooLongError(...args),
    UnsupportedMediaType: (...args) => new UnsupportedMediaTypeError(...args),
    RequestedRangeNotSatisfiable: (...args) => new RequestedRangeNotSatisfiableError(...args),
    ExpectationFailed: (...args) => new ExpectationFailedError(...args),
    Teapot: (...args) => new TeapotError(...args),
    MisdirectedRequest: (...args) => new MisdirectedRequestError(...args),
    UnprocessableEntity: (...args) => new UnprocessableEntityError(...args),
    Locked: (...args) => new LockedError(...args),
    FailedDependency: (...args) => new FailedDependencyError(...args),
    UpgradeRequired: (...args) => new UpgradeRequiredError(...args),
    PreconditionRequired: (...args) => new PreconditionRequiredError(...args),
    TooManyRequests: (...args) => new TooManyRequestsError(...args),
    RequestHeaderFieldsTooLarge: (...args) => new RequestHeaderFieldsTooLargeError(...args),
    UnavailableForLegalReasons: (...args) => new UnavailableForLegalReasonsError(...args),
    // Others
    CSV: (...args) => new CSVResponse(...args),
  },
  set errorMessageProvider(fn) {
    errorMessageProvider.set(fn);
  },
  set preJson(fn) {
    preJson.set(fn);
  },
  set postJson(fn) {
    postJson.set(fn);
  },
  set preError(fn) {
    preError.set(fn);
  },
  set postError(fn) {
    postError.set(fn);
  },
};
