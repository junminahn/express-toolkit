# express-json-router

Express router wrapper to send json response

![Test Status](https://github.com/junminahn/express-json-router/workflows/Tests/badge.svg)
![Publish Status](https://github.com/junminahn/express-json-router/workflows/Node.js%20Package/badge.svg)
![NPM](https://img.shields.io/npm/v/express-json-router.svg)

## Installation

```sh
$ npm install express-json-router
```

```sh
$ yarn add express-json-router
```

## Usage

```js
const express = require('express');
const JsonRouter = require('express-json-router');
const router = new JsonRouter();
const clientErrors = JsonRouter.clientErrors;
const app = express();

// Optional error message provider
// Default to `error.message || error._message || error`
JsonRouter.errorMessageProvider = function (error) {
  // Place an error parser here and return the new message.
  return 'It is a processed error message';
};

router.all('/all-route', () => 'all-route');
router.get('/get-route', () => 'get-route');
router.post('/post-route', () => 'post-route');
router.put('/put-route', () => 'put-route');
router.delete('/delete-route', () => 'delete-route');

router
  .route('/route-route')
  .all((req, res, next) => next())
  .get(() => 'route-get-route')
  .post(() => 'route-post-route')
  .put(() => 'route-put-route')
  .delete(() => 'route-delete-route');

router.get(
  '/next',
  (req, res, next) => next(),
  () => 'next-test'
);

router.get('/unauthorized-error', () => {
  throw new clientErrors.UnauthorizedError();
});

app.use('/', router.original).listen();
```

## Client Errors

- See https://www.npmjs.com/package/client-errors#client-errors-1 for more details.

### [MIT Licensed](LICENSE)
