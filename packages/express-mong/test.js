const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const Mong = require('./index');
const { defineTestModels } = require('./test-schema');
const { getAPI, testEqual, testNotEqual } = require('./test-helpers');

const DB_URL = 'mongodb://localhost:27017/test-db';
const PROMISE_TEST_API = '/api/promise-test';
const CALLBACK_TEST_API = '/api/callback-test';
const AUDIT_TEST_API = '/api/audit-test';

const app = express();
app.use(function (req, res, next) {
  req.timestamp = new Date().getTime();
  next();
});

app.set('port', 8080);
app.use(Mong());
app.route(PROMISE_TEST_API).get(promiseReturnTest);
app.route(CALLBACK_TEST_API).get(callbadkTest);
app.route(AUDIT_TEST_API).get(auditTest);

const server = http.createServer(app);
server.listen(8080);

Mong.setDecorator('Test', function () {
  this.$tag = 'test';
  return this;
});

function promiseReturnTest(req, res) {
  const timestamp = req.timestamp;
  const mong = req.mong;
  const Test = mong.model('Test');
  const Test2 = mong.model('Test2');

  // count
  const zeroCount = (count) => testEqual('count', count, 0);

  Test.create({ name: 'test1', timestamp }).then(() => {
    return (
      Test.find({ name: 'test1', timestamp })
        .then(() => Test.findOne({ name: 'test1', timestamp }))
        // findOneAndUpdate
        .then(() => Test.findOneAndUpdate({ name: 'test1', timestamp }, { name: 'test2' }, { new: true }))
        .then(({ name }) => testEqual('result findOneAndUpdate', name, 'test2'))
        // update
        .then(() => Test.update({ name: 'test2', timestamp }, { name: 'test3' }))
        .then(({ ok, nModified, n }) => testEqual('result update', nModified, 1))
        // updateOne
        .then(() => Test.updateOne({ name: 'test3', timestamp }, { name: 'test4' }))
        .then(({ ok, nModified, n }) => testEqual('result updateOne', nModified, 1))
        // updateMany
        .then(() => Test.updateMany({ name: 'test4', timestamp }, { name: 'test5' }))
        .then(({ ok, nModified, n }) => testEqual('result updateMany', nModified, 1))
        // replaceOne
        .then(() => Test.replaceOne({ name: 'test5', timestamp }, { name: 'test6' }))
        .then(({ ok, nModified, n }) => testEqual('result replaceOne', nModified, 1))
        // findOneAndRemove
        .then(() => Test.findOneAndRemove({ name: 'test6', timestamp }))
        .then(() => Test.count({ name: 'test6', timestamp }).then(zeroCount))
        // findOneAndDelete
        .then(() => Test.create({ name: 'test7', timestamp }))
        .then(() => Test.findOneAndDelete({ name: 'test7', timestamp }))
        .then(() => Test.count({ name: 'test7', timestamp }).then(zeroCount))
        // deleteOne
        .then(() => Test.create({ name: 'test8', timestamp }))
        .then(() => Test.deleteOne({ name: 'test8', timestamp }))
        .then(() => Test.count({ name: 'test8', timestamp }).then(zeroCount))
        // deleteMany
        .then(() => Test.create({ name: 'test9', timestamp }))
        .then(() => Test.deleteMany({ name: 'test9', timestamp }))
        .then(() => Test.count({ name: 'test9', timestamp }).then(zeroCount))
        // remove
        .then(() => Test.create({ name: 'test10', timestamp }))
        .then((doc) => doc.remove())
        .then(() => Test.count({ name: 'test10', timestamp }).then(zeroCount))
        // new document
        .then(() => {
          const newDoc = new Test({ name: 'test11', timestamp });
          return newDoc.save();
        })
        // aggregate
        .then(() => Test.aggregate([{ $match: { name: 'test11', timestamp } }]))
        .then((output) => testEqual('aggregate', output[0].name, 'test11'))
        // populate
        .then(() => {
          return Test2.create({ name: 'sub1' })
            .then((sub1) => {
              return Test.create({ name: 'test12', ref: sub1, timestamp });
            })
            .then(() => Test.findOne({ name: 'test12', timestamp }).populate('ref'))
            .then((doc) => {
              testEqual('doc populated', doc.ref.name, 'sub1');
              return doc;
            });
        })
        // static, method
        .then((doc) => {
          Test.static1(timestamp);
          doc.method1();
          const toObjectResult = doc.toObject();
          testEqual('timestamp from toObject', toObjectResult, timestamp);
          return doc;
        })
        // decorate
        .then(() => {
          return Test.findOne({ name: 'test12', timestamp }).then((doc) => {
            testEqual('doc decorated', doc.$tag, 'test');
          });
        })
        .then(() => {
          return Test.findOne({ name: 'test12', timestamp }).then((doc) => {
            testEqual('doc original', doc.$original.name, 'test12');
          });
        })
        .then((doc) => res.send('done'))
        .catch((err) => console.error(err))
    );
  });
}

function callbadkTest(req, res) {
  const timestamp = req.timestamp;
  const mong = req.mong;
  const Test = mong.model('Test');

  Test.create({ name: 'test1', timestamp }, function (err, doc) {
    testEqual('create callback', doc.name, 'test1');

    Test.find({ name: 'test1', timestamp }, function (err, docs) {
      testEqual('find callback', docs[0].name, 'test1');

      Test.findOne({ name: 'test1', timestamp }).exec(function (err, doc) {
        testEqual('findOne callback', doc.name, 'test1');

        res.send('done');
      });
    });
  });
}

function auditTest(req, res) {
  const timestamp = req.timestamp;
  const mong = req.mong;
  const User = mong.model('User');
  const Test = mong.model('Test');
  req.user = new User();

  Test.create({ name: 'test1', timestamp }).then((doc) => {
    testEqual('audit created by', doc.createdBy.toString(), req.user._id.toString());
    testEqual('audit updated at', doc.updatedAt.getTime(), doc.createdAt.getTime());

    doc.name = 'test2';
    doc.save().then((doc) => {
      testEqual('audit updated by', doc.updatedBy.toString(), req.user._id.toString());
      testNotEqual('audit updated at', doc.updatedAt.getTime(), doc.createdAt.getTime());

      res.send('done');
    });
  });
}

mongoose.connect(DB_URL);
// mongoose.set('debug', true);
mongoose.connection.dropDatabase().then(() => {
  defineTestModels();

  getAPI(PROMISE_TEST_API).then(() =>
    getAPI(CALLBACK_TEST_API).then(() =>
      getAPI(AUDIT_TEST_API).then(() => {
        process.exit();
      }),
    ),
  );
});
