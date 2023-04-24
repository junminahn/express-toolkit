/*!
 * express-json-router
 * Copyright(c) 2020 Junmin Ahn
 * MIT Licensed
 */

const clientErrors = require('client-errors');
const apiHandler = require('api-request-handler');
const success = require('api-request-handler/responses/success');

const { handleResponse } = apiHandler;

const METHODS = [
  'all',
  'checkout',
  'copy',
  'delete',
  'get',
  'head',
  'lock',
  'merge',
  'mkactivity',
  'mkcol',
  'move',
  'm-search',
  'notify',
  'options',
  'patch',
  'post',
  'purge',
  'put',
  'report',
  'search',
  'subscribe',
  'trace',
  'unlock',
  'unsubscribe',
];

const addLeadingSlash = (str) => (str.startsWith('/') ? str : `/${str}`);

class JsonRouter {
  methods = [];
  endpoints = [];

  constructor() {
    this._router = require('express').Router();

    // see https://expressjs.com/en/4x/api.html#router.METHOD
    let x = 0;
    const len = METHODS.length;
    for (x = 0; x < len; x++) {
      const method = METHODS[x];

      if (typeof this._router[method] !== 'function') {
        continue;
      }

      this.methods.push(method);

      Object.defineProperty(this, method, {
        value: function (path, ...callbacks) {
          this._router[method].call(this._router, path, handleResponse(callbacks));
          this.addEndpoint(method, path);
          return this;
        },
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
  }

  get original() {
    return this._router;
  }

  // see https://expressjs.com/en/4x/api.html#router.param
  param() {
    return this._router.param.apply(this._router, arguments);
  }

  // see https://expressjs.com/en/4x/api.html#router.use
  use() {
    return this._router.use.apply(this._router, arguments);
  }

  // see https://expressjs.com/en/4x/api.html#router.route
  route(path) {
    const _this = this;
    const def = {};

    let x = 0;
    const len = this.methods.length;
    for (x = 0; x < len; x++) {
      const method = this.methods[x];

      Object.defineProperty(def, method, {
        value: function (...args) {
          _this[method](path, ...args);
          return def;
        },
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }

    return def;
  }

  addEndpoint(method, path) {
    this.endpoints.push({ method: method.toUpperCase(), path: this.normalizePath(path) });
  }

  getEndpoints() {
    return this.endpoints;
  }

  normalizePath(path) {
    return addLeadingSlash(path.toLowerCase());
  }
}

JsonRouter.clientErrors = clientErrors;
JsonRouter.success = success;

Object.defineProperty(JsonRouter, 'errorMessageProvider', {
  set: function (customErrorMessageProvider) {
    apiHandler.errorMessageProvider = customErrorMessageProvider;
  },
});

Object.defineProperty(JsonRouter, 'preJson', {
  set: function (preJsonHookFn) {
    apiHandler.preJson = preJsonHookFn;
  },
});

Object.defineProperty(JsonRouter, 'postJson', {
  set: function (postJsonHookFn) {
    apiHandler.postJson = postJsonHookFn;
  },
});

Object.defineProperty(JsonRouter, 'preError', {
  set: function (preErrorHookFn) {
    apiHandler.preError = preErrorHookFn;
  },
});

Object.defineProperty(JsonRouter, 'postError', {
  set: function (postErrorHookFn) {
    apiHandler.postError = postErrorHookFn;
  },
});

module.exports = JsonRouter;
