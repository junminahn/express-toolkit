const http = require('http');
const express = require('express');
const expect = require('chai').expect;
const request = require('supertest');
const { UnauthorizedError } = require('client-errors');

const apiHandler = require('../index');

const { handleResponse } = apiHandler;

const app = express();
app.set('port', 8080);
const server = http.createServer(app);
server.listen(8080);

const hit = (url, status, value, done) =>
  request(app)
    .get(url)
    .expect('Content-Type', /json/)
    .expect(status)
    .then((response) => {
      expect(status >= 400 ? response.body.message : response.body).to.equal(value);
      done();
    });

describe('Single Middleware', function () {
  const key = 'single-middleware';
  const status = 200;
  const value = 'apple';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnApple));
    hit(`/${key}`, status, value, done);
  });
});

describe('Multiple Middlewares', function () {
  const key = 'multiple-middlewares';
  const status = 200;
  const value = 'pear';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnAppleNext, fnPear));
    hit(`/${key}`, status, value, done);
  });
});

describe('Multiple Middlewares Array', function () {
  const key = 'multiple-middlewares-array';
  const status = 200;
  const value = 'pear';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse([fnAppleNext, fnPear]));
    hit(`/${key}`, status, value, done);
  });
});

describe('Multiple Async Middlewares', function () {
  const key = 'multiple-async-middlewares';
  const status = 200;
  const value = 'pear';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnAppleNext, fnPearPromise));
    hit(`/${key}`, status, value, done);
  });
});

describe('Multiple Async Middlewares in Next', function () {
  const key = 'multiple-async-middlewares-next';
  const status = 200;
  const value = 'pear';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnAppleNext, fnPearInNext));
    hit(`/${key}`, status, value, done);
  });
});

describe('Error Handling', function () {
  const key = 'error-handling';
  const status = 422;
  const value = 'error1';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnAppleNext, fnError1, fnPear));
    hit(`/${key}`, status, value, done);
  });
});

describe('Async Error Handling', function () {
  const key = 'async-error-handling';
  const status = 422;
  const value = 'error1';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnAppleNext, fnError1Promise, fnPear));
    hit(`/${key}`, status, value, done);
  });
});

describe('Multiple Async Error Handling', function () {
  const key = 'multiple-async-error-handling';
  const status = 422;
  const value = 'error1';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnError2Next, fnError1));
    hit(`/${key}`, status, value, done);
  });
});

describe('Unauthorized Error Handling', function () {
  const key = 'unauthorized-error-handling';
  const status = 401;
  const value = 'The user is not authorized';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnUnauthorizedError));
    hit(`/${key}`, status, value, done);
  });
});

describe('Unauthorized Error in Next Handling', function () {
  const key = 'unauthorized-error-in-next-handling';
  const status = 401;
  const value = 'The user is not authorized';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnUnauthorizedErrorInNext));
    hit(`/${key}`, status, value, done);
  });
});

describe('Custom Client Error in Next Handling', function () {
  const key = 'custom-client-error-in-next-handling';
  const status = 422;
  const value = 'error-in-next';

  it(`should return ${value}`, function (done) {
    app.get(`/${key}`, handleResponse(fnErrorInNext));
    hit(`/${key}`, status, value, done);
  });
});

describe('Pre Json hook', function () {
  const key = 'pre-json-hook';
  const status = 200;
  const value = 'apple';

  it(`should return ${value}`, function (done) {
    let preData;

    apiHandler.preJson = function (data) {
      preData = data;
    };

    app.get(`/${key}`, handleResponse(fnApple));
    hit(`/${key}`, status, value, done).then(() => {
      expect(value).to.equal(preData);
    });
  });
});

describe('Pre Json hook with Post Json hook', function () {
  const key = 'pre-post-json-hook';
  const status = 200;
  const value = 'apple';

  it(`should return ${value}`, function (done) {
    let preData;
    let postData;

    apiHandler.postJson = function (data) {
      postData = data;
    };

    apiHandler.preJson = function (data) {
      preData = data;
    };

    app.get(`/${key}`, handleResponse(fnApple));
    hit(`/${key}`, status, value, done).then(() => {
      expect(value).to.equal(preData);
      expect(value).to.equal(postData);
    });
  });
});

describe('Pre Error hook', function () {
  const key = 'pre-error-hook';
  const status = 422;
  const value = 'error1';

  it(`should return ${value}`, function (done) {
    let preError;

    apiHandler.preError = function (err) {
      preError = err.message;
    };

    app.get(`/${key}`, handleResponse(fnError1));
    hit(`/${key}`, status, value, done).then(() => {
      expect(value).to.equal(preError);
    });
  });
});

describe('Pre Error hook with Post Error hook', function () {
  const key = 'pre-post-error-hook';
  const status = 422;
  const value = 'error1';

  it(`should return ${value}`, function (done) {
    let preError;
    let postError;

    apiHandler.postError = function (err) {
      postError = err.message;
    };

    apiHandler.preError = function (err) {
      preError = err.message;
    };

    app.get(`/${key}`, handleResponse(fnError1));
    hit(`/${key}`, status, value, done).then(() => {
      expect(value).to.equal(preError);
      expect(value).to.equal(postError);
    });
  });
});

describe('Custom Error Message Provider', function () {
  const key = 'custom-error-message-provider';
  const status = 422;
  const value = 'customError';

  it(`should return ${value}`, function (done) {
    apiHandler.errorMessageProvider = function () {
      return 'customError';
    };

    app.get(`/${key}`, handleResponse(fnError1));
    hit(`/${key}`, status, value, done);
  });
});

function fnApple() {
  return 'apple';
}

function fnAppleNext(req, res, next) {
  next();
  return 'apple';
}

function fnPear() {
  return 'pear';
}

function fnPearPromise() {
  return Promise.resolve('pear');
}

function fnPearInNext(req, res, next) {
  next('pear');
}

function fnError1() {
  throw new Error('error1');
}

function fnError1Promise() {
  return Promise.reject(new Error('error1'));
}

function fnError2Next(req, res, next) {
  next();
  throw new Error('error2');
}

function fnErrorInNext(req, res, next) {
  next(new Error('error-in-next'));
}

function fnUnauthorizedError() {
  throw new UnauthorizedError();
}

function fnUnauthorizedErrorInNext(req, res, next) {
  next(new UnauthorizedError());
}
