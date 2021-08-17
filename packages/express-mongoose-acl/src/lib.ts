import isFunction from 'lodash/isFunction';

export const isPromise = function isPromise(val) {
  return val && val.then && isFunction(val.then);
};

export const toAsyncFn = function toAsyncFn(fn: Function, defaultValue?: any) {
  if (!fn) return () => Promise.resolve(defaultValue);
  return function asyncFn(...args) {
    const ret = fn.apply(this, args);
    return isPromise(ret) ? ret : Promise.resolve(ret);
  };
};
