const http = require('http');
const express = require('express');
const expect = require('chai').expect;
const request = require('supertest');

const apiHandler = require('../index');
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
} = require('../responses/success');

const { handleResponse } = apiHandler;

const app = express();
app.set('port', 8081);
const server = http.createServer(app);
server.listen(8081);

const hit = (url, status, value, done) =>
  request(app)
    .get(url)
    .expect(status)
    .then((response) => {
      if (status === 204) {
        expect(response.headers['content-type']).to.be.undefined;
        expect(response.body).to.be.empty;
      } else if (status === 205) {
        expect(response.headers['content-type']).to.have.string('/json');
        expect(response.body).to.be.empty;
      } else {
        expect(response.headers['content-type']).to.have.string('/json');
        expect(response.body).to.equal(value);
      }

      done();
    });

describe('Successful responses', function () {
  it(`should return 200`, function (done) {
    const status = 200;
    app.get(
      `/${status}`,
      handleResponse(() => new OK(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 201`, function (done) {
    const status = 201;
    app.get(
      `/${status}`,
      handleResponse(() => new Created(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 202`, function (done) {
    const status = 202;
    app.get(
      `/${status}`,
      handleResponse(() => new Accepted(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 203`, function (done) {
    const status = 203;
    app.get(
      `/${status}`,
      handleResponse(() => new NonAuthoritativeInfo(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 204`, function (done) {
    const status = 204;
    app.get(
      `/${status}`,
      handleResponse(() => new NoContent('')),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 205`, function (done) {
    const status = 205;
    app.get(
      `/${status}`,
      handleResponse(() => new ResetContent(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 206`, function (done) {
    const status = 206;
    app.get(
      `/${status}`,
      handleResponse(() => new PartialContent(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 207`, function (done) {
    const status = 207;
    app.get(
      `/${status}`,
      handleResponse(() => new MultiStatus(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 208`, function (done) {
    const status = 208;
    app.get(
      `/${status}`,
      handleResponse(() => new AlreadyReported(status)),
    );

    hit(`/${status}`, status, status, done);
  });

  it(`should return 226`, function (done) {
    const status = 226;
    app.get(
      `/${status}`,
      handleResponse(() => new IMUsed(status)),
    );

    hit(`/${status}`, status, status, done);
  });
});
