// @ts-nocheck
import * as mongoose from 'mongoose';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';
import isPlainObject from 'lodash/isPlainObject';

function recurseObject(obj: any) {
  if (obj instanceof mongoose.Schema) {
    return recurseSchema(obj.tree);
  }

  if (!isObject(obj)) return null;
  if (
    isPlainObject(obj) &&
    obj.ref &&
    obj.type &&
    (obj.type === 'ObjectId' || obj.type === mongoose.Schema.Types.ObjectId)
  ) {
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
  const ret = {};
  forEach(schema, (val, key) => {
    const paths = recurseObject(val);
    if (!isEmpty(paths)) {
      ret[key] = paths;
    }
  });

  return ret;
}
