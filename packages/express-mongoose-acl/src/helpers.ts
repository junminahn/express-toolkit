// @ts-nocheck
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import noop from 'lodash/noop';
import forEach from 'lodash/forEach';
import { isSchema, isReference } from './lib';

function recurseObject(obj: any) {
  if (isSchema(obj)) {
    return buildRefs(obj.tree);
  }

  if (!isObject(obj)) return null;
  if (isReference(obj)) {
    return obj.ref;
  }

  let ret = null;
  forEach(obj, (val, key) => {
    ret = recurseObject(val);
    if (!isEmpty(ret)) {
      return false;
    }
  });

  return ret;
}

export function buildRefs(schema: any) {
  const references = {};
  const subPaths = [];

  forEach(schema, (val, key) => {
    const paths = recurseObject(val);
    if (!isEmpty(paths)) {
      references[key] = paths;
    }

    // collection subdocuments paths
    // see https://mongoosejs.com/docs/subdocs.html#subdocuments
    const target = val.type || val;
    if (isArray(target) && target.length > 0) {
      if (isSchema(target[0]) || isPlainObject(target[0])) {
        subPaths.push(key);
      }
    }
  });

  return references;
}

export function buildSubPaths(schema: any) {
  const subPaths = [];

  forEach(schema, (val, key) => {
    // collection subdocuments paths
    // see https://mongoosejs.com/docs/subdocs.html#subdocuments
    const target = val.type || val;
    if (isArray(target) && target.length > 0) {
      if (isSchema(target[0]) || (isPlainObject(target[0]) && !isReference(target[0]))) {
        subPaths.push(key);
      }
    }
  });

  return subPaths;
}

async function mapValuesAsync(object, asyncFn) {
  return Object.fromEntries(
    await Promise.all(Object.entries(object).map(async ([key, value]) => [key, await asyncFn(value, key, object)])),
  );
}

export async function iterateQuery(query: any, handler: Function) {
  if (!isPlainObject(query)) return query;
  if (!handler) return noop;

  return mapValuesAsync(query, async (val, key) => {
    if (isPlainObject(val)) {
      if (val.$$sq) {
        return handler(val.$$sq, key);
      } else {
        return iterateQuery(val, handler);
      }
    }

    if (isArray(val)) {
      return Promise.all(val.map((v) => iterateQuery(v, handler)));
    }

    return val;
  });
}

export const normalizeSelect = (select: string | string[]) => {
  return Array.isArray(select)
    ? select.map((v) => v.trim())
    : isString(select)
    ? select.split(' ').map((v) => v.trim())
    : null;
};
