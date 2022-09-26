import get from 'lodash/get';
import set from 'lodash/set';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import castArray from 'lodash/castArray';
import isFunction from 'lodash/isFunction';
import isNaN from 'lodash/isNaN';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';
import noop from 'lodash/noop';
import pick from 'lodash/pick';
import forEach from 'lodash/forEach';
import compact from 'lodash/compact';
import intersection from 'lodash/intersection';
import difference from 'lodash/difference';
import { getGlobalOption, getModelOption } from './options';
import { getModelRef } from './meta';
import { Populate, Projection, MiddlewareContext, Validation } from './interfaces';
import Permission, { Permissions } from './permission';
import Controller from './controller';
import PublicController from './controller-public';
import { normalizeSelect, arrToObj, createValidator } from './helpers';
import { isDocument } from './lib';

const MIDDLEWARE = Symbol('middleware');
export const PERMISSIONS = Symbol('permissions');
export const PERMISSION_KEYS = Symbol('permission-keys');

const callMiddleware = async (
  req: any,
  middleware: Function | Function[],
  doc: any,
  permissions: Permissions,
  context: MiddlewareContext,
) => {
  middleware = castArray(middleware);
  for (let x = 0; x < middleware.length; x++) {
    if (isFunction(middleware[x])) {
      doc = await middleware[x].call(req, doc, permissions, context);
    }
  }

  return doc;
};

export async function genIDQuery(modelName: string, id: string) {
  const identifier = getModelOption(modelName, 'identifier', '_id');

  if (isString(identifier)) {
    return { [identifier]: id };
  } else if (isFunction(identifier)) {
    return identifier.call(this, id);
  }

  return { _id: id };
}

export async function genQuery(modelName: string, access: string = 'read', _query: any = null) {
  const baseQueryFn = getModelOption(modelName, `baseQuery.${access}`, null);
  if (!isFunction(baseQueryFn)) return _query || {};

  const permissions = this[PERMISSIONS];

  const baseQuery = await baseQueryFn.call(this, permissions);
  if (baseQuery === false) return false;
  if (baseQuery === true || isEmpty(baseQuery)) return _query || {};
  if (!_query) return baseQuery;

  return { $and: [baseQuery, _query] };
}

export function genPagination({ page = 1, limit }, hardLimit) {
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit) || limit > hardLimit) limit = hardLimit;

  const options: { limit: string; skip?: number } = { limit };
  if (page > 1) options.skip = (page - 1) * limit;
  return options;
}

function getDocPermissions(modelName, doc) {
  const docPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  let docPermissions = {};
  if (isDocument(doc)) {
    docPermissions = (doc._doc && doc._doc[docPermissionField]) || {};
  } else if (isPlainObject(doc)) {
    docPermissions = doc[docPermissionField] || {};
  }

  return docPermissions;
}

function setDocPermissions(doc, path, value) {
  if (isDocument(doc)) {
    set(doc._doc, path, value);
  } else if (isPlainObject(doc)) {
    set(doc, path, value);
  }
}

function getModelKeys(doc) {
  return Object.keys(isDocument(doc) ? doc._doc : doc);
}

function toObject(doc) {
  return isDocument(doc) ? doc.toObject() : doc;
}

export async function genAllowedFields(modelName: string, doc: any, access: string, baseFields = []) {
  let fields = baseFields || [];

  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return fields;

  const permissions = this[PERMISSIONS];
  const docPermissions = getDocPermissions(modelName, doc);
  // get keys from permission schema as some fields might not be filled when created
  const keys = Object.keys(permissionSchema);
  // const keys = getModelKeys(doc);

  const phas = (key) => permissions.has(key) || docPermissions[key];
  const [stringHandler, arrayHandler] = createValidator(phas);

  for (let x = 0; x < keys.length; x++) {
    const key = keys[x];
    if (baseFields.includes(key)) continue;

    const val = permissionSchema[key];
    const value = (val && val[access]) || val;

    if (isBoolean(value)) {
      if (value) fields.push(key);
    } else if (isString(value)) {
      if (stringHandler(value)) fields.push(key);
    } else if (isArray(value)) {
      if (arrayHandler(value)) fields.push(key);
    } else if (isFunction(value)) {
      if (await value.call(this, permissions, docPermissions)) fields.push(key);
    }
  }

  return fields;
}

export async function pickAllowedFields(modelName: string, doc: any, access: string, baseFields = []) {
  const allowed = await this._genAllowedFields(modelName, doc, access, baseFields);
  return pick(toObject(doc), allowed);
}

export async function genSelect(
  modelName: string,
  access: string,
  targetFields: Projection | null = null,
  skipChecks = true,
  subPaths = [],
) {
  let normalizedSelect = normalizeSelect(targetFields);
  let fields = [];

  const permissionSchema = getModelOption(modelName, ['permissionSchema'].concat(subPaths).join('.'));
  if (!permissionSchema) return fields;

  const permissions = this[PERMISSIONS];

  const phas = (key) => {
    if (permissions.prop(key)) {
      if (permissions.has(key)) return true;
    } else if (skipChecks) {
      return true;
    }

    return false;
  };

  const [stringHandler, arrayHandler] = createValidator(phas);

  const keys = Object.keys(permissionSchema);
  for (let x = 0; x < keys.length; x++) {
    const key = keys[x];
    const val = permissionSchema[key];
    const value = val[access] || val;

    if (isBoolean(value)) {
      if (value) fields.push(key);
    } else if (isString(value)) {
      if (stringHandler(value)) fields.push(key);
    } else if (isArray(value)) {
      if (arrayHandler(value)) fields.push(key);
    } else if (isFunction(value)) {
      if (await value.call(this, permissions)) fields.push(key);
    }
  }

  if (normalizedSelect.length > 0) {
    const excludeid = normalizedSelect.includes('-_id');
    const excludeall = normalizedSelect.every((v) => v.startsWith('-'));
    if (excludeall) {
      normalizedSelect = normalizedSelect.map((v) => v.substring(1));
      fields = difference(fields, normalizedSelect);
      if (excludeid) fields.push('-_id');
    } else {
      fields = intersection(normalizedSelect, fields.concat(excludeid ? '-_id' : '_id'));
    }
  }

  const mandatoryFields = subPaths.length > 0 ? [] : getModelOption(modelName, 'mandatoryFields', []);
  return fields.concat(mandatoryFields);
}

export async function genPopulate(modelName: string, access: string = 'read', _populate: any = null) {
  if (!_populate) return [];

  let populate = Array.isArray(_populate) ? _populate : [_populate];
  populate = compact(
    await Promise.all(
      populate.map(async (p: Populate | string) => {
        const ret: Populate = isString(p)
          ? { path: p }
          : {
              path: p.path,
              select: normalizeSelect(p.select),
            };

        const refModelName = getModelRef(modelName, ret.path);
        if (!refModelName) return null;

        if (!isString(p) && p.access) access = p.access;
        ret.select = await this._genSelect(refModelName, access, ret.select, false);
        const query = await this._genQuery(refModelName, access, null);
        if (query === false) return null;

        ret.match = query;
        return ret;
      }),
    ),
  );

  return populate;
}

export async function validate(modelName: string, allowedData: any, access: string, context: MiddlewareContext = {}) {
  const validate = getModelOption(modelName, `validate.${access}`, null);

  if (isFunction(validate)) {
    const permissions = this[PERMISSIONS];
    return validate.call(this, allowedData, permissions, context) as boolean | any[];
  } else if (isBoolean(validate) || isArray(validate)) {
    return validate;
  } else {
    return true;
  }
}

export async function prepare(modelName: string, allowedData: any, access: string, context: MiddlewareContext = {}) {
  const prepare = getModelOption(modelName, `prepare.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, prepare, allowedData, permissions, context);
}

export async function transform(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const transform = getModelOption(modelName, `transform.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, transform, doc, permissions, context);
}

export async function genDocPermissions(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const permit = getModelOption(modelName, `docPermissions.${access}`, null);
  let docPermissions = {};

  if (isFunction(permit)) {
    const permissions = this[PERMISSIONS];
    docPermissions = await permit.call(this, doc, permissions, context);
  }

  return docPermissions;
}

export async function permit(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const docPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  const docPermissions = await this._genDocPermissions(modelName, doc, access, context);
  setDocPermissions(doc, docPermissionField, docPermissions);

  const allowedFields = await this._genAllowedFields(modelName, doc, 'update');
  // TODO: do we need falsy fields as well?
  // const permissionSchemaKeys = getModelOption(modelName, 'permissionSchemaKeys');

  // TODO: make it flexible structure
  forEach(allowedFields, (field) => {
    setDocPermissions(doc, `${docPermissionField}.edit.${field}`, true);
  });

  return doc;
}

export async function decorate(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const decorate = getModelOption(modelName, `decorate.${access}`, null);

  const permissions = this[PERMISSIONS];
  context.docPermissions = getDocPermissions(modelName, doc);

  return callMiddleware(this, decorate, doc, permissions, context);
}

export async function decorateAll(modelName, docs, access) {
  const decorateAll = getModelOption(modelName, `decorateAll.${access}`, null);
  const permissions = this[PERMISSIONS];

  return callMiddleware(this, decorateAll, docs, permissions, {});
}

export function getPermissions() {
  const permissionField = getGlobalOption('permissionField');
  return new Permission(this[permissionField] || {});
}

export async function setPermissions() {
  const permissionField = getGlobalOption('permissionField');
  if (this[permissionField]) return;

  const globalPermissions = getGlobalOption('globalPermissions');
  if (isFunction(globalPermissions)) {
    const gp = await globalPermissions.call(this, this);
    if (isPlainObject(gp)) this[permissionField] = gp;
    else if (isArray(gp)) this[permissionField] = arrToObj(gp);
    else if (isString(gp)) this[permissionField] = { [gp]: true };
  }
}

export async function canActivate(routeGuard: Validation) {
  let allowed = false;

  const permissions = this[PERMISSIONS];
  const phas = (key) => permissions.has(key);
  const [stringHandler, arrayHandler] = createValidator(phas);

  if (isBoolean(routeGuard)) {
    return routeGuard === true;
  } else if (isString(routeGuard)) {
    return stringHandler(routeGuard);
  } else if (isArray(routeGuard)) {
    return arrayHandler(routeGuard);
  } else if (isFunction(routeGuard)) {
    return routeGuard.call(this, permissions);
  }

  return allowed;
}

export async function isAllowed(modelName, access) {
  const routeGuard = getModelOption(modelName, `routeGuard.${access}`);
  return this._canActivate(routeGuard);
}

export function macl(modelName: string) {
  return new Controller(this, modelName);
}

export function maclExt(modelName: string) {
  return new PublicController(this, modelName);
}

export async function setGenerators(req, res, next) {
  if (req[MIDDLEWARE]) return next();

  req._genIDQuery = genIDQuery.bind(req);
  req._genQuery = genQuery.bind(req);
  req._genPagination = genPagination.bind(req);
  req._genAllowedFields = genAllowedFields.bind(req);
  req._genSelect = genSelect.bind(req);
  req._pickAllowedFields = pickAllowedFields.bind(req);
  req._genPopulate = genPopulate.bind(req);
  req._genDocPermissions = genDocPermissions.bind(req);
  req._validate = validate.bind(req);
  req._prepare = prepare.bind(req);
  req._transform = transform.bind(req);
  req._permit = permit.bind(req);
  req._decorate = decorate.bind(req);
  req._decorateAll = decorateAll.bind(req);
  req._getPermissions = getPermissions.bind(req);
  req._setPermissions = setPermissions.bind(req);
  req._canActivate = canActivate.bind(req);
  req._isAllowed = isAllowed.bind(req);
  req._macl = maclExt.bind(req);
  req.macl = macl.bind(req);

  await req._setPermissions();
  req[PERMISSIONS] = req.permissions = req._getPermissions();
  req[PERMISSION_KEYS] = req[PERMISSIONS].$_permissionKeys;
  req[MIDDLEWARE] = true;
  next();
}
