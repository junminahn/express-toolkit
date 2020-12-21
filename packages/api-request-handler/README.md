# api-request-handler

API Request Handler

## Installation

```sh
$ npm install api-request-handler
```

## Usage

### handleResponse

- handleResponse (callback)
- handleResponse (callback, callback2)
- handleResponse ([callback, callback2])

### errorMessageProvider

- apiHandler.errorMessageProvider = customErrorMessageProvider

### Example

```js
const http = require('http');
const express = require('express');
const axios = require('axios');

const apiHandler = require('api-request-handler');
const baseUrl = 'http://localhost:8080';

const handleResponse = apiHandler.handleResponse;

const app = express();
app.set('port', 8080);
const server = http.createServer(app);
server.listen(8080);

// Single Middleware
app.get('/single-middleware', handleResponse(fnApple)); // apple; status 200

// Multiple Middlewares
app.get('/multiple-middlewares', handleResponse(fnAppleNext, fnPear)); // pear; status 200

// Multiple Middlewares Array
app.get('/multiple-middlewares-array', handleResponse([fnAppleNext, fnPear])); // pear; status 200

// Multiple Async Middlewares
app.get('/multiple-async-middlewares', handleResponse(fnAppleNext, fnPearPromise)); // pear; status 200

// Error Handling
app.get('/error-handling', handleResponse(fnAppleNext, fnError1, fnPear)); // error1; status 422

// Async Error Handling
app.get('/async-error-handling', handleResponse(fnAppleNext, fnError1Promise, fnPear)); // error1; status 422

// Multiple Async Error Handling
app.get('/multiple-async-error-handling', handleResponse(fnError2Next, fnError1)); // error1; status 422

// Custom Error Message Provider
apiHandler.errorMessageProvider = function (err) {
  return 'customError';
};
app.get('/custom-error-message-provider', handleResponse(fnError1)); // customError; status 422

function fnApple(req, res, next) {
  return 'apple';
}

function fnApplePromise(req, res, next) {
  return Promise.resolve('apple');
}

function fnAppleNext(req, res, next) {
  next();
  return 'apple';
}

function fnPear(req, res, next) {
  return 'pear';
}

function fnPearPromise(req, res, next) {
  return Promise.resolve('pear');
}

function fnPearNext(req, res, next) {
  next();
  return Promise.resolve('pear');
}

function fnError1(req, res, next) {
  throw new Error('error1');
}

function fnError1Promise(req, res, next) {
  return Promise.reject(new Error('error1'));
}

function fnError2Next(req, res, next) {
  next();
  throw new Error('error2');
}
```

### [MIT Licensed](LICENSE)
