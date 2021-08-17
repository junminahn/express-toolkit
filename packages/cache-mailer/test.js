const http = require('http');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const assert = require('assert');
const axios = require('axios');

const mailer = require('./index');

mailer.setOptions({ cache: false, templateEngine: 'handlebars' });

const port = 3333;
const baseURL = `http://localhost:${port}`;

const axiosInstance = axios.create({ baseURL });

const app = express();
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

let testAccount1;
let testAccount2;

const receiver = 'test1@test.com';
const sender = '"Test" <admin@test.com>';

describe('Create Test Account', function () {
  this.timeout(5000);
  it(`should create a test1 account`, function (done) {
    nodemailer.createTestAccount().then((account) => {
      testAccount1 = account;
      done();
    });
  });

  it(`should create a test2 account`, function (done) {
    nodemailer.createTestAccount().then((account) => {
      testAccount2 = account;
      done();
    });
  });
});

describe('Create Transport', function () {
  this.timeout(5000);

  it(`should create a default mailer transport`, function (done) {
    mailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount1.user,
        pass: testAccount1.pass,
      },
    });
    done();
  });

  it(`should create a test mailer transport`, function (done) {
    mailer.createTransport('test', {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount2.user,
        pass: testAccount2.pass,
      },
    });
    done();
  });
});

describe('Register Template', function () {
  this.timeout(5000);

  it(`should register a template`, function (done) {
    const _template = '<p>Hello World!</p>';
    mailer
      .registerTemplates([
        {
          key: 'test1',
          template: _template,
          subject: 'Hello World',
        },
        {
          key: 'test2',
          template: '<p>{{fruit}}</p>',
          subject: 'fruit',
        },
        {
          key: 'test3',
          template: '<p>{{req.path}}</p>',
          subject: 'request path',
        },
      ])
      .then((templates) => {
        const ass = assert.equal(_template, templates[0].template);
        done(ass);
      });
  });
});

describe('Send Email', function () {
  this.timeout(5000);

  it(`should accept ${receiver} with default mailer transport`, function (done) {
    mailer
      .sendEmail({
        key: 'test1',
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.accepted[0], receiver);
        done();
      });
  });

  it(`should accept ${receiver} with test mailer transport`, function (done) {
    mailer
      .getTransport('test')
      .sendEmail({
        key: 'test1',
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.accepted[0], receiver);
        done();
      });
  });

  it(`should throw a type error with unregistered mailer transport`, function (done) {
    try {
      mailer.getTransport('unregistered').sendEmail({
        key: 'test1',
        receiver,
        sender,
      });
    } catch (e) {
      assert.ok(e instanceof TypeError);
      done();
    }
  });
});

describe('Send Email with Interpolated HTML', function () {
  this.timeout(5000);

  it(`should replace {{fruit}} to 'apple' with default mailer transport`, function (done) {
    mailer
      .sendEmail({
        key: 'test2',
        data: { fruit: 'apple' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'apple');
        done();
      });
  });

  it(`should replace {{fruit}} to 'apple' with test mailer transport`, function (done) {
    mailer
      .getTransport('test')
      .sendEmail({
        key: 'test2',
        data: { fruit: 'apple' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'apple');
        done();
      });
  });
});

describe('Send Email with Local Data', function () {
  this.timeout(5000);

  mailer.setLocals({ fruit: 'apple' });
  it(`should replace {{fruit}} to 'apple'`, function (done) {
    mailer
      .sendEmail({
        key: 'test2',
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'apple');
        done();
      });
  });
});

describe('Fail to Send Email with Request', function () {
  this.timeout(5000);

  const path = '/send-email-with-request';

  it(`should have no 'sendEmail' method in request`, function (done) {
    app.get(path, function (req, res, next) {
      assert.equal(req.sendEmail, undefined);
      done();
    });
    axiosInstance.get(path);
  });
});

describe('Remove all mailer transports', function () {
  this.timeout(5000);

  it(`should have no 'test' mailer transport`, function (done) {
    mailer.clearTransports();

    const transport = mailer.getTransport('test');
    assert.equal(transport, undefined);
    done();
  });
});

describe('Create Express middleware and Bind to request', function () {
  this.timeout(5000);

  it(`should create one with default mailer transport`, function (done) {
    app.use(
      mailer({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount1.user,
          pass: testAccount1.pass,
        },
      }),
    );
    done();
  });
});

describe('Send Email with Request Data', function () {
  this.timeout(5000);

  const path = '/send-email-with-request-data';

  it(`should replace {{req.path}} to '${path}'`, function (done) {
    app.get(path, function (req, res, next) {
      req
        .sendEmail({
          key: 'test3',
          receiver,
          sender,
        })
        .then((info) => {
          assert.equal(info.text, path);
          done();
        });
    });
    axiosInstance.get(path);
  });
});

describe('Register Template with Cache', function () {
  this.timeout(5000);

  it(`should cache a template`, function (done) {
    mailer.setOptions({ cache: true });

    const _template = '<p>Hello {{World}} Again!</p>';
    mailer
      .registerTemplate({
        key: 'test4',
        template: _template,
        subject: 'Hello World Again',
      })
      .then(({ html }) => {
        // handlebar instance
        assert.equal('<p>Hello  Again!</p>', html().trim());
        done();
      });
  });

  it(`should replace {{World}} to 'kitty'`, function (done) {
    mailer
      .sendEmail({
        key: 'test4',
        data: { World: 'kitty' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'Hello kitty Again!');
        done();
      });
  });
});

describe('Register Template with Value Function', function () {
  this.timeout(5000);

  it(`should cache a template`, function (done) {
    mailer
      .registerTemplate({
        key: 'test5',
        valueFn: () => Promise.resolve({ template: '<p>I am a {{animal}}</p>', subject: 'Who are you?' }),
      })
      .then(({ html }) => {
        // handlebar instance
        assert.equal('<p>I am a </p>', html().trim());
        done();
      });
  });

  it(`should replace {{animal}} to 'cat'`, function (done) {
    mailer
      .sendEmail({
        key: 'test5',
        data: { animal: 'cat' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'I am a cat');
        done();
      });
  });
});

describe('Register Template with Value Template Path', function () {
  this.timeout(5000);

  it(`should cache a template`, function (done) {
    mailer
      .registerTemplate({
        key: 'test6',
        templatePath: path.resolve('./test.html'),
        subject: 'Hello There',
      })
      .then(({ html }) => {
        // handlebar instance
        assert.equal('<p>which </p>', html().trim());
        done();
      });
  });

  it(`should replace {{fruit}} to 'banana'`, function (done) {
    mailer
      .sendEmail({
        key: 'test6',
        data: { fruit: 'banana' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'which banana');
        done();
      });
  });
});

describe('Register ejs Template', function () {
  this.timeout(5000);

  it(`should cache ejs template`, function (done) {
    mailer
      .registerTemplate({
        key: 'test7',
        templatePath: path.resolve('./test.ejs'),
        subject: 'Hello EJS',
        templateEngine: 'ejs',
      })
      .then(({ html }) => {
        assert.ok(html);
        done();
      });
  });

  it(`should replace <%= type %> to 'ejs'`, function (done) {
    mailer
      .sendEmail({
        key: 'test7',
        data: { type: 'ejs' },
        receiver,
        sender,
      })
      .then((info) => {
        assert.equal(info.text, 'hi ejs');
        done();
      });
  });
});
