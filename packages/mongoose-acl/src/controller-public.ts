import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isMatch from 'lodash/isMatch';
import filter from 'lodash/filter';
import compact from 'lodash/compact';
import flatten from 'lodash/flatten';
import { normalizeSelect, iterateQuery, CustomError } from './helpers';
import Controller from './controller';
import {
  ModelRouterProps,
  MiddlewareContext,
  SubPopulate,
  ListProps,
  ReadProps,
  CreateOptionProps,
  UpdateOptionProps,
  DistinctOptionProps,
  Defaults,
  Populate,
} from './interfaces';

const filterChildren = (children, query) => {
  if (isPlainObject(query))
    return query.$and ? filter(children, (v) => query.$and.every((q) => isMatch(v, q))) : filter(children, query);

  return children;
};

const genSubPopulate = (sub: string, popul: any) => {
  if (!popul) return [];

  let populate = Array.isArray(popul) ? popul : [popul];
  populate = populate.map((p: SubPopulate | string) => {
    const ret: SubPopulate = isString(p)
      ? { path: `${sub}.${p}` }
      : {
          path: `${sub}.${p.path}`,
          select: normalizeSelect(p.select),
        };

    return ret;
  });

  return populate;
};

class PublicController extends Controller {
  async list({
    query = {},
    select = this.defaults.list?.select,
    sort = this.defaults.list?.sort,
    populate = this.defaults.list?.populate,
    limit = this.defaults.list?.limit,
    page = this.defaults.list?.page,
    options = this.defaults.list?.options || {},
  }: ListProps = {}) {
    const { includePermissions = true, includeCount = false, populateAccess = 'read', lean = false } = options;

    query = await iterateQuery(query, async (sq, key) => {
      const { model, mapper, ...rest } = sq;
      const m = this.req._macl(model);
      const arr = await m.list(rest);
      if (mapper) {
        const m = mapper.multi === false ? false : true;
        const c = mapper.compact === true;
        const f = mapper.flatten === true;
        const path = mapper.path || mapper;
        if (!m) return get(arr[0], path, isNil(mapper.defaultValue) ? null : mapper.defaultValue);

        let items = arr.map((v) => get(v, path));
        if (f) items = flatten(items);
        if (c) items = compact(items);
        return items;
      }
      return arr;
    });

    let pagination = null;
    [query, select, populate, pagination] = await Promise.all([
      this.req._genQuery(this.modelName, 'list', query),
      this.req._genSelect(this.modelName, 'list', select),
      this.req._genPopulate(this.modelName, populateAccess, populate),
      this.req._genPagination({ limit, page }, this.options.listHardLimit),
    ]);

    if (query === false) return [];

    // prevent populate paths from updating query select fields
    if (select) populate = (populate as Populate[]).filter((p) => select.includes(p.path.split('.')[0]));

    let docs = await this.model.find({ query, select, sort, populate, lean, ...pagination });
    docs = await Promise.all(
      docs.map(async (doc) => {
        if (includePermissions) doc = await this.req._permit(this.modelName, doc, 'list');
        doc = await this.req._pickAllowedFields(this.modelName, doc, 'list', ['_id', this.options.permissionField]);
        return this.req._decorate(this.modelName, doc, 'list');
      }),
    );

    const rows = await this.req._decorateAll(this.modelName, docs, 'list');

    if (includeCount) {
      return {
        count: await this.model.countDocuments(query),
        rows,
      };
    } else {
      return rows;
    }
  }

  async create(data, options: CreateOptionProps = this.defaults.create || {}) {
    const { includePermissions = true } = options as any;

    const isArr = Array.isArray(data);
    let arr = isArr ? data : [data];

    const contexts: MiddlewareContext[] = [];

    const items = await Promise.all(
      arr.map(async (item) => {
        const context: MiddlewareContext = { originalData: item };

        const allowedFields = await this.req._genAllowedFields(this.modelName, item, 'create');
        const allowedData = pick(item, allowedFields);

        const validated = await this.req._validate(this.modelName, allowedData, 'create', context);
        if (isBoolean(validated)) {
          if (!validated) throw new CustomError({ statusCode: 400, message: 'validation failed' });
        } else if (isArray(validated)) {
          if (validated.length > 0)
            throw new CustomError({ statusCode: 400, message: 'validation failed', errors: validated });
        }

        const preparedData = await this.req._prepare(this.modelName, allowedData, 'create', context);

        context.preparedData = preparedData;
        contexts.push(context);
        return preparedData;
      }),
    );

    let docs = await this.model.create(items);
    docs = await Promise.all(
      docs.map(async (doc, index) => {
        if (includePermissions) doc = await this.req._permit(this.modelName, doc, 'create', contexts[index]);
        doc = await this.req._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
        return this.req._decorate(this.modelName, doc, 'create', contexts[index]);
      }),
    );

    return isArr ? docs : docs[0];
  }

  async empty() {
    return this.model.new();
  }

  async read(
    id,
    {
      select = this.defaults.read?.select,
      populate = this.defaults.read?.populate,
      options = this.defaults.read?.options || {},
    }: ReadProps = {},
  ) {
    let access = 'read';
    const { includePermissions = true, tryList = true, populateAccess, lean = false } = options;
    const idQuery = await this.req._genIDQuery(this.modelName, id);

    let doc = await this.findById(id, {
      select,
      populate,
      options: { includePermissions, access, populateAccess, lean },
      overrides: { idQuery },
    });

    // if not found, try to get the doc with 'list' access
    if (!doc && tryList) {
      access = 'list';

      doc = await this.findById(id, {
        select,
        populate,
        options: { includePermissions, access, populateAccess, lean },
        overrides: { idQuery },
      });
    }

    if (!doc) return null;

    doc = await this.req._pickAllowedFields(this.modelName, doc, access, ['_id', this.options.permissionField]);
    doc = await this.req._decorate(this.modelName, doc, access);

    return doc;
  }

  async update(id, data, options: UpdateOptionProps = this.defaults.update || {}) {
    const { returningAll = true } = options;

    let query = await this.req._genQuery(this.modelName, 'update', await this.req._genIDQuery(this.modelName, id));
    if (query === false) return null;

    let doc = await this.model.findOne({ query });
    if (!doc) return null;

    const context: MiddlewareContext = {};

    context.originalDoc = doc.toObject();
    context.originalData = data;

    doc = await this.req._permit(this.modelName, doc, 'update', context);

    context.currentDoc = doc;
    const allowedFields = await this.req._genAllowedFields(this.modelName, doc, 'update');
    const allowedData = pick(data, allowedFields);

    const validated = await this.req._validate(this.modelName, allowedData, 'update', context);
    if (isBoolean(validated)) {
      if (!validated) throw new CustomError({ statusCode: 400, message: 'validation failed' });
    } else if (isArray(validated)) {
      if (validated.length > 0)
        throw new CustomError({ statusCode: 400, message: 'validation failed', errors: validated });
    }

    const prepared = await this.req._prepare(this.modelName, allowedData, 'update', context);

    context.preparedData = prepared;
    Object.assign(doc, prepared);

    context.modifiedPaths = doc.modifiedPaths();
    doc = await this.req._transform(this.modelName, doc, 'update', context);
    context.modifiedPaths = doc.modifiedPaths();
    doc = await doc.save();
    doc = await this.req._permit(this.modelName, doc, 'update', context);
    doc = await this.req._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
    doc = await this.req._decorate(this.modelName, doc, 'update', context, true);

    return returningAll ? doc : pick(doc, Object.keys(data));
  }

  async delete(id) {
    let query = await this.req._genQuery(this.modelName, 'delete', await this.req._genIDQuery(this.modelName, id));
    if (query === false) return null;

    let doc = await this.model.findOneAndRemove(query);
    if (!doc) return null;

    await doc.remove();
    return doc._id;
  }

  async distinct(field, options: DistinctOptionProps = this.defaults.distinct || {}) {
    let { query } = options;

    query = await this.req._genQuery(this.modelName, 'read', query);
    if (query === false) return null;

    const result = await this.model.distinct(field, query);
    if (!result) return null;

    return result;
  }

  async count(query, access = 'list') {
    query = await this.req._genQuery(this.modelName, access, query);
    if (query === false) return 0;

    return this.model.countDocuments(query);
  }

  private async getParentDoc(id, sub, access, populate = []) {
    const parentQuery = await this.req._genQuery(
      this.modelName,
      access,
      await this.req._genIDQuery(this.modelName, id),
    );

    if (parentQuery === false) return null;
    return this.model.findOne({ query: parentQuery, select: sub, populate });
  }

  async listSub(id, sub, options = {}) {
    let { filter: ft, fields } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subSelect] = await Promise.all([
      this.req._genQuery(this.modelName, `subs.${sub}.list`, ft),
      this.req._genSelect(this.modelName, 'list', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
    if (subSelect) result = result.map((v) => pick(v, subSelect.concat(['id'])));
    return result;
  }

  async readSub(id, sub, subId, options = {}) {
    let { fields, populate } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read', genSubPopulate(sub, populate));
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subSelect] = await Promise.all([
      this.req._genQuery(this.modelName, `subs.${sub}.read`),
      this.req._genSelect(this.modelName, 'read', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    if (subSelect) result = pick(result, subSelect.concat(['id']));
    return result;
  }

  async updateSub(id, sub, subId, data) {
    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subReadSelect, subUpdateSelect] = await Promise.all([
      this.req._genQuery(this.modelName, `subs.${sub}.update`),
      this.req._genSelect(this.modelName, 'read', null, false, [sub, 'sub']),
      this.req._genSelect(this.modelName, 'update', null, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    const allowedData = pick(data, subUpdateSelect);
    Object.assign(result, allowedData);

    await parentDoc.save();
    if (subReadSelect) result = pick(result, subReadSelect.concat(['id']));
    return result;
  }

  async createSub(id, sub, data, options = {}) {
    let { addFirst } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subCreateSelect, subReadSelect] = await Promise.all([
      this.req._genSelect(this.modelName, 'create', null, false, [sub, 'sub']),
      this.req._genSelect(this.modelName, 'read', null, false, [sub, 'sub']),
    ]);

    const allowedData = pick(data, subCreateSelect);
    addFirst === true ? result.unshift(allowedData) : result.push(allowedData);

    await parentDoc.save();
    if (subReadSelect) result = result.map((v) => pick(v, subReadSelect.concat(['id'])));
    return result;
  }

  async deleteSub(id, sub, subId) {
    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const subQuery = await this.req._genQuery(this.modelName, `subs.${sub}.delete`);

    result = filterChildren(result, subQuery);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    await result.remove();
    await parentDoc.save();
    return result._id;
  }
}

export default PublicController;
