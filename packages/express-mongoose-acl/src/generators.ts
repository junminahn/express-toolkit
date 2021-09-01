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

const PERMISSIONS = Symbol('permissions');

export async function genQuery(modelName, access = 'read', _query) {
  const baseQueryFn = getModelOption(modelName, `baseQuery.${access}`, null);
  if (!isFunction(baseQueryFn)) return _query || {};

  const permissions = this[PERMISSIONS];

  const baseQuery = await baseQueryFn.call(this, permissions);
  if (isEmpty(baseQuery)) return _query;
  if (!_query) return baseQuery;

  return { $and: [baseQuery, _query] };
}

export function genPagination({ page = 1, limit }, hardLimit) {
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit)) limit = hardLimit;

  const options: { limit: string; skip?: number } = { limit };
  if (page > 1) options.skip = (page - 1) * limit;
  return options;
}

export async function genSelect(modelName, access = 'read', _select) {
  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return null;

  const permissions = this[PERMISSIONS];
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

async function genAllowedFields(modelName, doc, access) {
  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return null;

  const permissions = this[PERMISSIONS];
  const modelPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  const modelPermissions = doc._doc[modelPermissionField] || {};
  const fields = [];

  const keys = Object.keys(permissionSchema);
  for (let x = 0; x < keys.length; x++) {
    const key = keys[x];
    const val = permissionSchema[key];
    const value = val[access] || val;

    if (isBoolean(value)) {
      if (value) fields.push(key);
    } else if (isString(value)) {
      if (modelPermissions[value]) fields.push(key);
    } else if (isFunction(value)) {
      if (await value.call(this, modelPermissions, permissions)) fields.push(key);
    }
  }

  return fields;
}

export function genEditableFields(modelName, doc) {
  return genAllowedFields.call(this, modelName, doc, 'update');
}

export function genCreatableFields(modelName, doc) {
  return genAllowedFields.call(this, modelName, doc, 'create');
}

export async function prepare(modelName, docObject, access) {
  const prepare = getModelOption(modelName, `prepare.${access}`, null);

  if (isFunction(prepare)) {
    const permissions = this[PERMISSIONS];
    docObject = await transform.call(this, docObject, permissions);
  }

  return docObject;
}

export async function transform(modelName, doc, access) {
  const transform = getModelOption(modelName, `transform.${access}`, null);

  if (isFunction(transform)) {
    const permissions = this[PERMISSIONS];
    doc = await transform.call(this, doc, permissions);
  }

  return doc;
}

export async function permit(modelName, doc, access) {
  const permit = getModelOption(modelName, `docPermissions.${access}`, null);
  const modelPermissionField = getModelOption(modelName, 'permissionField', '_permissions');

  if (isFunction(permit)) {
    const permissions = this[PERMISSIONS];
    doc._doc[modelPermissionField] = await permit.call(this, doc, permissions);
  } else {
    doc._doc[modelPermissionField] = {};
  }

  return doc;
}

export async function decorate(modelName, doc, access, pickFields) {
  const decorate = getModelOption(modelName, `decorate.${access}`, null);
  doc = doc.toObject();

  if (pickFields) {
    const fields = await this._genSelect(modelName, 'read');
    const permissionField = getModelOption(modelName, 'permissionField', '_permissions');
    doc = pick(doc, fields.concat(permissionField));
  }

  if (isFunction(decorate)) {
    const permissions = this[PERMISSIONS];
    doc = await decorate.call(this, doc, permissions);
  }

  return doc;
}

export function getPermissions() {
  const permissionField = getOption('permissionField');
  return this[permissionField] || {};
}

export function setGenerators(req, res, next) {
  req._genQuery = genQuery.bind(req);
  req._genPagination = genPagination.bind(req);
  req._genSelect = genSelect.bind(req);
  req._genPopulate = genPopulate.bind(req);
  req._genCreatableFields = genCreatableFields.bind(req);
  req._genEditableFields = genEditableFields.bind(req);
  req._prepare = prepare.bind(req);
  req._transform = transform.bind(req);
  req._permit = permit.bind(req);
  req._decorate = decorate.bind(req);
  req._getPermissions = getPermissions.bind(req);
  req[PERMISSIONS] = req._getPermissions();
  next();
}
