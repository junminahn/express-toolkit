import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isNaN from 'lodash/isNaN';
import isEmpty from 'lodash/isEmpty';
import noop from 'lodash/noop';
import pick from 'lodash/pick';
import forEach from 'lodash/forEach';
import compact from 'lodash/compact';
import intersection from 'lodash/intersection';
import { getOption, getModelOption, getModelRef } from './options';
import { Populate } from './interfaces';

export async function setDocPermissions(modelName, doc) {
  const docPermissionsFn = getModelOption(modelName, 'docPermissions', null);
  if (!docPermissionsFn) return doc;

  const permissions = this._getPermissions();
  const modelPermissionField = getModelOption(modelName, 'permissionField', '_permissions');

  if (!doc._doc[modelPermissionField])
    doc._doc[modelPermissionField] = await docPermissionsFn.call(this, doc, permissions);

  return doc;
}

export function genPagination({ page = 1, limit }, hardLimit) {
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit)) limit = hardLimit;

  const options: { limit: string; skip?: number } = { limit };
  if (page > 1) options.skip = (page - 1) * limit;
  return options;
}

export async function genQuery(modelName, access = 'read', _query) {
  const baseQueryFn = getModelOption(modelName, `baseQuery.${access}`, null);
  if (!isFunction(baseQueryFn)) return _query || {};

  const permissions = this._getPermissions();

  const baseQuery = await baseQueryFn.call(this, permissions);
  if (isEmpty(baseQuery)) return _query;
  if (!_query) return baseQuery;

  return { $and: [baseQuery, _query] };
}

export async function genSelect(modelName, access = 'read', _select) {
  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return null;

  const permissions = this._getPermissions();
  const select = ['_id'];

  const keys = Object.keys(permissionSchema);
  for (let x = 0; x < keys.length; x++) {
    const key = keys[x];
    const val = permissionSchema[key];
    const value = val[access] || val;

    if (isBoolean(value)) {
      select.push(key);
    } else if (isString(value)) {
      if (permissions[value]) select.push(key);
    } else if (isFunction(value)) {
      if (await value.call(this, permissions)) select.push(key);
    }
  }

  return Array.isArray(_select) ? intersection(_select, select) : select;
}

export async function genEditableFields(modelName, doc) {
  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return null;

  const permissions = this._getPermissions();
  const modelPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  const modelPermissions = doc._doc[modelPermissionField] || {};
  const fields = [];

  const keys = Object.keys(permissionSchema);
  for (let x = 0; x < keys.length; x++) {
    const key = keys[x];
    const val = permissionSchema[key];
    const value = val['update'] || val;

    if (isBoolean(value)) {
      fields.push(key);
    } else if (isString(value)) {
      if (modelPermissions[value]) fields.push(key);
    } else if (isFunction(value)) {
      if (await value.call(this, modelPermissions, permissions)) fields.push(key);
    }
  }

  return fields;
}

export async function genPopulate(modelName, access = 'read', _populate) {
  if (!_populate) return null;

  let populate = Array.isArray(_populate) ? _populate : [_populate];
  populate = compact(
    await Promise.all(
      populate.map(async (p: Populate | string) => {
        const ret: Populate = isString(p) ? { path: p } : { path: p.path, select: p.select };
        const refModelName = getModelRef(modelName, ret.path);
        if (!refModelName) return null;

        access = isString(p) ? access : p.access;
        ret.select = await this._genSelect(refModelName, access, ret.select);
        ret.match = await this._genQuery(refModelName, access, null);

        return ret;
      }),
    ),
  );

  return populate;
}

export async function decorate(modelName, doc, access, pickFields) {
  const decorator = getModelOption(modelName, `decorator.${access}`, null);
  doc = await this._setDocPermissions(modelName, doc);
  doc = doc.toObject();

  if (pickFields) {
    const fields = await this._genSelect(modelName, 'read');
    const permissionField = getModelOption(modelName, 'permissionField', '_permissions');
    doc = pick(doc, fields.concat(permissionField));
  }

  if (isFunction(decorator)) {
    const permissionField = getOption('permissionField');
    const permissions = this[permissionField] || {};
    doc = await decorator.call(this, doc, permissions);
  }

  return doc;
}

export function getPermissions() {
  const permissionField = getOption('permissionField');
  return this[permissionField] || {};
}

export function setGenerators(req, res, next) {
  req._setDocPermissions = setDocPermissions.bind(req);
  req._genQuery = genQuery.bind(req);
  req._genPagination = genPagination.bind(req);
  req._genSelect = genSelect.bind(req);
  req._genPopulate = genPopulate.bind(req);
  req._genEditableFields = genEditableFields.bind(req);
  req._decorate = decorate.bind(req);
  req._getPermissions = getPermissions.bind(req);
  next();
}
