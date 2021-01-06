/*!
 * express-json-router
 * Copyright(c) 2020 Junmin Ahn
 * MIT Licensed
 */

const clientErrors = require('client-errors');
const apiHandler = require('api-request-handler');

const { handleResponse } = apiHandler;

class JsonRouter {
  constructor() {
    this._router = require('express').Router();
  }

  get original() {
    return this._router;
  }

  param() {
    return this._router.param.apply(this._router, arguments);
  }

  use() {
    return this._router.use.apply(this._router, arguments);
  }

  all(path, ...callbacks) {
    this._router.all.call(this._router, path, handleResponse(callbacks));
    return this;
  }

  get(path, ...callbacks) {
    this._router.get.call(this._router, path, handleResponse(callbacks));
    return this;
  }

  post(path, ...callbacks) {
    this._router.post.call(this._router, path, handleResponse(callbacks));
    return this;
  }

  put(path, ...callbacks) {
    this._router.put.call(this._router, path, handleResponse(callbacks));
    return this;
  }

  delete(path, ...callbacks) {
    this._router.delete.call(this._router, path, handleResponse(callbacks));
    return this;
  }

  route(path) {
    const _this = this;
    const def = {
      all() {
        _this.all(path, ...arguments);
        return def;
      },
      get() {
        _this.get(path, ...arguments);
        return def;
      },
      post() {
        _this.post(path, ...arguments);
        return def;
      },
      put() {
        _this.put(path, ...arguments);
        return def;
      },
      delete() {
        _this.delete(path, ...arguments);
        return def;
      },
    };

    return def;
  }
}

JsonRouter.clientErrors = clientErrors;

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
