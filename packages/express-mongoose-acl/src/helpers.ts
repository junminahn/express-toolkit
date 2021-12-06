// @ts-nocheck
import * as mongoose from 'mongoose';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import forEach from 'lodash/forEach';

const isSchema = (val) => val instanceof mongoose.Schema;
const isObjectIdType = (val) => val === 'ObjectId' || val === mongoose.Schema.Types.ObjectId;

function recurseObject(obj: any) {
  if (isSchema(obj)) {
    return recurseSchema(obj.tree);
  }

  if (!isObject(obj)) return null;
  if (isPlainObject(obj) && obj.ref && isObjectIdType(obj.type)) {
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

export function recurseSchema(schema: any) {
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

  return { references, subPaths };
}
