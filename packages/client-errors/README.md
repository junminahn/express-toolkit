# client-errors

Client (4xx) error classes including status codes and messages for each error in Node server.

## Installation

```sh
$ npm install client-errors
```

## Example

### Basic Usage

```js
const { ClientError, UnauthorizedError } = require('client-errors');

// Use of a derived class
throw new UnauthorizedError(); // default message: 'The user is not authorized'
throw new UnauthorizedError('you are a bad guy!'); // custom message: 'you are a bad guy'

// Use of a error code
throw new ClientError(401); // default message: 'The user is not authorized'
throw new ClientError(401, 'you are a bad guy!'); // custom message: 'you are a bad guy'
```

### Usage of Sending Status Code

```js
const express = require('express');
const router = express.Router();
const { ClientError, UnauthorizedError, BadRequestError } = require('client-errors');
const mongoose = require('mongoose');

router.put('/items/:id', updateItem);

function updateItem(req, res) {
  mongoose
    .model('Item')
    .findById(req.params.id)
    .then(item => {
      if (!item) throw new BadRequestError('item does not exist');
      if (item.ownedBy !== req.user.id) throw new UnauthorizedError('invalid access to this item');

      const data = req.body;
      if (data.ownedBy !== req.user.id) throw new ClientError(403, 'cannot update owners of items');

      item.set(data);
      item.save().then(res.json);
    })
    .catch(err => {
      let status, message;
      if (err.statusCode) {
        status = err.statusCode;
        message = err.message;
      } else {
        status = 422;
        message = err;
      }
      res.status(status).send({ message });
    });
}
```

## Client Errors

| Code | Description                     | Code Name                         | Default Message                                                                                            |
| ---- | ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 400  | Bad Request                     | BadRequestError                   | The server cannot process the request due to a client error                                                |
| 401  | Unauthorized                    | UnauthorizedError                 | The user is not authorized                                                                                 |
| 403  | Forbidden                       | ForbiddenError                    | The server refused to authorize the request                                                                |
| 404  | Not Found                       | NotFoundError                     | The server did not find a current representation for the target resource                                   |
| 405  | Method Not Allowed              | MethodNotAllowedError             | The method received is not allowed                                                                         |
| 406  | Not Acceptable                  | NotAcceptableError                | The request is not acceptable to the user agent                                                            |
| 407  | Proxy Authentication Required   | ProxyAuthRequiredError            | The client needs to authenticate itself in order to use a proxy                                            |
| 408  | Request Timeout                 | RequestTimeoutError               | The request was not completed in the expected time                                                         |
| 409  | Conflict                        | ConflictError                     | The request was not completed due to a conflict with the target resource                                   |
| 410  | Gone                            | GoneError                         | The target resource is no longer available at the origin server                                            |
| 411  | Length Required                 | LengthRequiredError               | The server refuses to accept the request without a defined Content-Length                                  |
| 412  | Precondition Failed             | PreconditionFailedError           | One or more conditions given in the request header fields evaluated to false                               |
| 413  | Payload Too Large               | PayloadTooLargeError              | The request payload is too large                                                                           |
| 414  | Request-URI Too Long            | UriTooLongError                   | The request target is too longer                                                                           |
| 415  | Unsupported Media Typ           | UnsupportedMediaTypeError         | The payload is in a format not supported                                                                   |
| 416  | Requested Range Not Satisfiable | RequestedRangeNotSatisfiableError | None of the ranges in the request's Range header field overlap the current extent of the selected resource |
| 417  | Expectation Failed              | ExpectationFailedError            | The expectation given in the request\'s Expect header field could not be met                               |
| 418  | I'm a teapot                    | TeapotError                       | I'm a teapot                                                                                               |
| 421  | Misdirected Request             | MisdirectedRequestError           | The request was directed at a server that is not able to produce a response                                |
| 422  | Unprocessable Entity            | UnprocessableEntityError          | The server is unable to process the request                                                                |
| 423  | Locked                          | LockedError                       | The source or destination resource of a method is locked                                                   |
| 424  | Failed Dependency               | FailedDependencyError             | The requested action depended on another action                                                            |
| 426  | Upgrade Required                | UpgradeRequiredError              | This service requires use of a different protocol                                                          |
| 428  | Precondition Required           | PreconditionRequiredError         | This request is required to be conditional                                                                 |
| 429  | Too Many Requests               | TooManyRequestsError              | The user has sent too many requests in a given amount of time                                              |
| 431  | Request Header Fields Too Large | RequestHeaderFieldsTooLargeError  | Request header fields too large                                                                            |
| 451  | Unavailable For Legal Reasons   | UnavailableForLegalReasonsError   | Denied access due to a consequence of a legal demand                                                       |

### [MIT Licensed](LICENSE)
