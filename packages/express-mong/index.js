const mongoose = require('mongoose');
// const Model = require('mongoose/lib/model');
const Schema = mongoose.Schema;
const { modelProperties, modelMethods } = require('./mong-data');
const modelWrapper = require('./model-wrapper');

let _decorators;
let _keepOriginal;
const _tmpDecorators = {};

function Mong(req) {
  this.req = req;
  this.models = Object.create(null);
}

Mong.prototype.model = function (name) {
  const model = mongoose.models[name];
  if (!model) throw new Error(`Mongoose Model "${name}" is not defined.`);
  if (!this.models[name])
    this.models[name] = modelWrapper(this.req, model, { decorator: _decorators[name], keepOriginal: _keepOriginal });
  return this.models[name];
};

Mong.prototype._mongoose = mongoose;

Mong.prototype.modelNames = mongoose.modelNames.bind(mongoose);

function mongFactory({ decorators = {}, keepOriginal = true } = {}) {
  _decorators = Object.assign(decorators, _tmpDecorators);
  _keepOriginal = keepOriginal;

  // const checkAvailability = (field) => {
  //   if (!Model.hasOwnProperty(field)) {
  //     console.error(`${field} is not supported in current mongoose version.`);
  //   }
  // };

  // modelProperties.forEach(checkAvailability);
  // modelMethods.forEach(checkAvailability);

  return function (req, res, next) {
    req.mong = new Mong(req);
    next();
  };
}

mongFactory.setDecorator = function (name, fn) {
  if (_decorators) {
    _decorators[name] = fn;
  } else {
    _tmpDecorators[name] = fn;
  }
};

module.exports = mongFactory;
