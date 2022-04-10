import Document from 'mongoose/lib/document';
import Schema from 'mongoose/lib/schema';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';

export const isSchema = (val) => val instanceof Schema;
export const isObjectIdType = (val) => val === 'ObjectId' || val === Schema.Types.ObjectId;
export const isReference = (val) => isPlainObject(val) && val.ref && isObjectIdType(val.type);

export const isPromise = function isPromise(val) {
  return val && val.then && isFunction(val.then);
};

export const isDocument = function isDocument(doc) {
  return doc instanceof Document;
};

export const toAsyncFn = function toAsyncFn(fn: Function, defaultValue?: any) {
  if (!fn) return () => Promise.resolve(defaultValue);
  return function asyncFn(...args) {
    const ret = fn.apply(this, args);
    return isPromise(ret) ? ret : Promise.resolve(ret);
  };
};
