const http = require('http');
const express = require('express');
const expect = require('chai').expect;
const request = require('supertest');
const { parse } = require('@fast-csv/parse');

const apiHandler = require('../index');
const { CSVResponse } = require('../responses/csv');

const { handleResponse, HttpResponse } = apiHandler;

const app = express();
app.set('port', 8082);
const server = http.createServer(app);
server.listen(8082);

describe('CSV responses', function () {
  it(`should return stringified array of objects`, function (done) {
    const url = '/csv';
    const testData = [
      { col1: 'a', col2: 'b' },
      { col1: 'a1', col2: 'b1' },
      { col1: 'a2', col2: 'b2' },
    ];

    app.get(
      url,
      handleResponse(() => new CSVResponse(testData)),
    );

    request(app)
      .get(url)
      .expect(200)
      .expect('Content-Type', /csv/)
      .then((response) => {
        const result = [];
        const stream = parse({ headers: true })
          .on('error', (error) => console.error(error))
          .on('data', (row) => result.push(row))
          .on('end', () => {
            expect(JSON.stringify(testData)).to.equal(JSON.stringify(result));
            done();
          });

        stream.write(response.text);
        stream.end();
      });
  });

  it(`should return stringified array of arrays`, function (done) {
    const url = '/csv2';
    const testData = [
      ['a', 'b'],
      ['a1', 'b1'],
      ['a2', 'b2'],
    ];

    app.get(
      url,
      handleResponse(() => new CSVResponse(testData)),
    );

    request(app)
      .get(url)
      .expect(200)
      .expect('Content-Type', /csv/)
      .then((response) => {
        const result = [];
        const stream = parse({ headers: false })
          .on('error', (error) => console.error(error))
          .on('data', (row) => result.push(row))
          .on('end', () => {
            expect(JSON.stringify(testData)).to.equal(JSON.stringify(result));
            done();
          });

        stream.write(response.text);
        stream.end();
      });
  });

  it(`should return stringified array of arrays2`, function (done) {
    const url = '/csv3';
    const testData = [
      ['a', 'b'],
      ['a1', 'b1'],
      ['a2', 'b2'],
    ];

    app.get(
      url,
      handleResponse(() => HttpResponse.CSV(testData)),
    );

    request(app)
      .get(url)
      .expect(200)
      .expect('Content-Type', /csv/)
      .then((response) => {
        const result = [];
        const stream = parse({ headers: false })
          .on('error', (error) => console.error(error))
          .on('data', (row) => result.push(row))
          .on('end', () => {
            expect(JSON.stringify(testData)).to.equal(JSON.stringify(result));
            done();
          });

        stream.write(response.text);
        stream.end();
      });
  });
});
