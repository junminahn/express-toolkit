// @ts-nocheck
import * as mongoose from 'mongoose';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import forEach from 'lodash/forEach';

const isSchema = (val) => val instanceof mongoose.Schema;
const isObjectIdType = (val) => val === 'ObjectId' || val === mongoose.Schema.Types.ObjectId;
const isReference = (val) => isPlainObject(val) && val.ref && isObjectIdType(val.type);

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

export const normalizeSelect = (select: string | string[]) => {
  return Array.isArray(select)
    ? select.map((v) => v.trim())
    : isString(select)
    ? select.split(' ').map((v) => v.trim())
    : null;
};
