const express = require('express');
const expect = require('expect.js');
const request = require('supertest');
const JsonRouter = require('./index');

const router = new JsonRouter();
const { clientErrors } = JsonRouter;

const ORIGINAL_ERROR_MESSAGE = 'It is an original error message';
const CUSTOM_ERROR_MESSAGE = 'It is a custom error message';

const app = express();

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
  () => 'next-test',
);

router.get('/unauthorized-error', () => {
  throw new clientErrors.UnauthorizedError();
});

router.get('/original-error-message', () => {
  throw new Error(ORIGINAL_ERROR_MESSAGE);
});

router.get('/custom-error-message', () => {
  throw new Error(ORIGINAL_ERROR_MESSAGE);
});

app.use('/', router.original).listen();

describe(`Check if route exists`, function () {
  it(`all-route`, function (done) {
    request(app)
      .get('/all-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('all-route');
        return done();
      });
  });

  it(`get-route`, function (done) {
    request(app)
      .get('/get-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('get-route');
        return done();
      });
  });

  it(`post-route`, function (done) {
    request(app)
      .post('/post-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('post-route');
        return done();
      });
  });

  it(`put-route`, function (done) {
    request(app)
      .put('/put-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('put-route');
        return done();
      });
  });

  it(`delete-route`, function (done) {
    request(app)
      .delete('/delete-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('delete-route');
        return done();
      });
  });

  it(`route-get-route`, function (done) {
    request(app)
      .get('/route-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('route-get-route');
        return done();
      });
  });

  it(`route-post-route`, function (done) {
    request(app)
      .post('/route-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('route-post-route');
        return done();
      });
  });

  it(`route-put-route`, function (done) {
    request(app)
      .put('/route-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('route-put-route');
        return done();
      });
  });

  it(`route-delete-route`, function (done) {
    request(app)
      .delete('/route-route')
      .end((err, res) => {
        expect(res.body).to.be.equal('route-delete-route');
        return done();
      });
  });
});

describe(`Check other routing functions`, function () {
  it(`next`, function (done) {
    request(app)
      .get('/next')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.be.equal('next-test');
        return done();
      });
  });

  it(`unauthorized-error`, function (done) {
    request(app)
      .get('/unauthorized-error')
      .expect(401)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        expect(res.body.message).to.be.equal('The user is not authorized');
        return done();
      });
  });

  it(`original-error-message`, function (done) {
    request(app)
      .get('/original-error-message')
      .expect(401)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        expect(res.body.message).to.be.equal(ORIGINAL_ERROR_MESSAGE);
        return done();
      });
  });

  it(`custom-error-message`, function (done) {
    JsonRouter.errorMessageProvider = function () {
      return CUSTOM_ERROR_MESSAGE;
    };

    request(app)
      .get('/custom-error-message')
      .expect(401)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        expect(res.body.message).to.be.equal(CUSTOM_ERROR_MESSAGE);
        return done();
      });
  });
});
