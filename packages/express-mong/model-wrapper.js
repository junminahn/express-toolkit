const mongoose = require('mongoose');
const Document = require('mongoose/lib/document');
const modelSymbol = require('mongoose/lib/helpers/symbols').modelSymbol;

const { modelProperties, modelMethods } = require('./mong-data');

const Schema = mongoose.Schema;

const _isDocument = function (doc) {
  return doc instanceof Document;
};

const _isFunction = function (func) {
  return typeof func === 'function';
};

const _isPromise = function (val) {
  return val && val.then && _isFunction(val.then);
};

const _setRequest = function (req, thing) {
  thing.$req = req;
  return thing;
};

const _setOriginal = function (doc) {
  doc.$original = doc.toObject({ transform: false });
  return doc;
};

const _setDocument = function (req, doc, original) {
  _setRequest(req, doc);
  if (original) _setOriginal(doc);
  return doc;
};

const _toAsyncFn = function (fn, defaultValue) {
  if (!fn) return () => Promise.resolve(defaultValue);
  return function (...args) {
    const ret = fn.apply(this, args);
    return _isPromise(ret) ? ret : Promise.resolve(ret);
  };
};

const _decorateResult = function (req, result, { decorator, keepOriginal }) {
  if (Array.isArray(result)) {
    if (result.length === 0) return result;

    if (_isDocument(result[0])) {
      if (decorator) {
        const decoratorAsync = _toAsyncFn(decorator);
        return Promise.all(
          result.map(rst => {
            _setDocument(req, rst, keepOriginal);
            return decoratorAsync.call(rst, req);
          })
        );
      }

      return result.map(rst => _setDocument(req, rst, keepOriginal));
    }

    return result;
  }

  if (_isDocument(result)) {
    if (decorator) {
      const decoratorAsync = _toAsyncFn(decorator);
      _setDocument(req, result, keepOriginal);
      return decoratorAsync.call(result, req);
    }

    return _setDocument(req, result, keepOriginal);
  }

  return result;
};

const _decorateMethod = function (req, queryOrAggregate, { decorator, keepOriginal }) {
  const _exec = queryOrAggregate.exec;

  _setRequest(req, queryOrAggregate);
  queryOrAggregate.then = function (resolve, reject) {
    return this.exec().then(resolve, reject);
  };

  queryOrAggregate.exec = function (callback) {
    if (_isFunction(callback)) {
      _exec
        .apply(queryOrAggregate)
        .then(result => {
          return _decorateResult(req, result, { decorator, keepOriginal });
          //
          // const res = _decorateResult(req, result, { decorator, keepOriginal });
          // callback(null, res);
        })
        .then(
          res => callback(null, res),
          err => callback(err)
        );
    } else {
      return _exec.apply(queryOrAggregate).then(result => {
        return _decorateResult(req, result, { decorator, keepOriginal });
      });
    }

    return undefined;
  };
  return queryOrAggregate;
};

function modelWrapper(req, model, { decorator, keepOriginal }) {
  function MongModel() {
    _setRequest(req, this);
    const newmodel = new model(...arguments);
    _setRequest(req, newmodel);
    return newmodel;
  }

  MongModel[modelSymbol] = true;

  _setRequest(req, MongModel);

  MongModel._model = model;

  modelProperties.forEach(property => (MongModel[property] = model[property]));

  modelMethods.forEach(m => {
    MongModel[m] = function () {
      const callback = [].pop.call(arguments);

      if (_isFunction(callback)) {
        const q = model[m](...arguments);
        _decorateMethod(req, q, { decorator, keepOriginal }).then(
          res => callback(null, res),
          err => callback(err)
        );
      } else {
        const q = model[m](...arguments, callback);
        return _decorateMethod(req, q, { decorator, keepOriginal });
      }

      return undefined;
    };
  });

  //////////////////////////////////
  // Wrap Static Methods / Values //
  //////////////////////////////////
  Object.keys(model.schema.statics).forEach(s => {
    const ms = model[s];
    if (_isFunction(ms)) {
      MongModel[s] = function () {
        return ms.bind(MongModel)(...arguments);
      };
    } else {
      MongModel[s] = ms;
    }
  });

  MongModel.create = model.create.bind(MongModel);

  return MongModel;
}

module.exports = modelWrapper;
