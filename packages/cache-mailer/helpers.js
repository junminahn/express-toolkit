const fs = require('fs');

const isString = function (value) {
  return typeof value === 'string';
};

const isFunction = function (value) {
  return typeof value === 'function';
};

const isPlainObject = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

const isArray = Array.isArray;

const isNil = function (value) {
  return value === undefined || value === null;
};

const readFileAsync = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, content) {
      if (err) return reject(err);
      return resolve(content.toString());
    });
  });
};

module.exports = {
  isString,
  isFunction,
  isNil,
  isPlainObject,
  isArray,
  readFileAsync,
};
