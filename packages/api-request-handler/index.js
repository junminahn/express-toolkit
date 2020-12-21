/*!
 * api-request-handler
 * Copyright(c) 2019 Junmin Ahn
 * MIT Licensed
 */
const assert = require('assert');

/**
 * Helper functions to identify specific types.
 */
const isFunction = fn => typeof fn === 'function';
const isPromise = p => p && isFunction(p.then);
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
const sendJson = function (res, data) {
  res.json(data);
};

/**
 * Send an error message with 4xx response code.
 */
const sendError = function (res, err) {
  if (err.statusCode) {
    res.status(err.statusCode).send({ message: err.message });
  } else {
    res.status(422).send({ message: errorMessageProvider._provider(err) });
  }
};

/**
 * Complete a request with a returned promise.
 */
const handlePromise = function (res, promise) {
  promise.then(sendJson.bind(null, res), sendError.bind(null, res));
};

/**
 * Complete a request with a returned result.
 * The result is either 'Promise' or any type of value.
 */
const handleResult = function (res, result, event) {
  if (res.headersSent) return;
  if (event.canceled) return;

  if (isPromise(result)) handlePromise(res, result);
  else sendJson(res, result);
};

/**
 * Return an express next function wrapper and ensure the event is canceled.
 */
const nextFn = function (event, next) {
  return function (...args) {
    event.canceled = true;
    next(...args);
  };
};

/**
 * Return an express router function.
 */
const routerFn = function (fn) {
  const event = {
    canceled: false,
  };
  return function (req, res, next) {
    try {
      const result = fn(req, res, nextFn(event, next));
      handleResult(res, result, event);
    } catch (err) {
      if (res.headersSent) return;
      sendError(res, err);
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
  set errorMessageProvider(fn) {
    errorMessageProvider.set(fn);
  },
};
