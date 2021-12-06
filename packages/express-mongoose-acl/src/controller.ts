import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import Model from './model';
import { setModelOptions, setModelOption, getModelOptions } from './options';
import { ModelRouterProps, MiddlewareContext } from './interfaces';

class Controller {
  req: any;
  modelName: string;
  model: Model;
  options: ModelRouterProps;

  constructor(req: any, modelName: string) {
    this.req = req;
    this.modelName = modelName;
    this.model = new Model(modelName);
    this.options = getModelOptions(modelName);
  }

  async listQuery({ query, select, sort, populate, limit, page, options = {} }) {
    const { includePermissions = true, includeCount = false, populateAccess = 'read' } = options as any;

    let pagination = null;
    [query, select, populate, pagination] = await Promise.all([
      this.req._genQuery(this.modelName, 'list', query),
      this.req._genSelect(this.modelName, 'list', query),
      this.req._genPopulate(this.modelName, populateAccess, populate),
      this.req._genPagination({ limit, page }, this.options.listHardLimit),
    ]);

    if (query === false) return [];

    // prevent populate paths from updating query select fields
    if (select) populate = populate.filter((p) => select.includes(p.path.split('.')[0]));

    let docs = await this.model.find({ query, select, sort, populate, ...pagination });
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

  async create(data, options = {}) {
    const { includePermissions = true } = options as any;

    const isArr = Array.isArray(data);
    let arr = isArr ? data : [data];

    const contexts: MiddlewareContext[] = [];

    const items = await Promise.all(
      arr.map(async (item) => {
        const context: MiddlewareContext = { originalData: item };

        const allowedFields = await this.req._genAllowedFields(this.modelName, item, 'create');
        const allowedData = pick(item, allowedFields);
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

  async readQuery(id, { select, populate, options = {} }) {
    const { includePermissions = true, tryList = true, populateAccess = 'read' } = options as any;

    let query = null;
    [query, select, populate] = await Promise.all([
      this.req._genQuery(this.modelName, 'read', await this.req._genIDQuery(this.modelName, id)),
      this.req._genSelect(this.modelName, 'read', select),
      this.req._genPopulate(this.modelName, populateAccess, populate),
    ]);

    if (query === false) return null;

    let doc = await this.model.findOne({ query, select, populate });

    // if not found, try to get the doc with 'list' access
    if (!doc && tryList) {
      [query, select] = await Promise.all([
        this.req._genQuery(this.modelName, 'list', await this.req._genIDQuery(this.modelName, id)),
        this.req._genSelect(this.modelName, 'list', select),
      ]);

      doc = await this.model.findOne({ query, select, populate });
    }

    if (!doc) return null;

    if (includePermissions) doc = await this.req._permit(this.modelName, doc, 'read');
    doc = await this.req._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
    doc = await this.req._decorate(this.modelName, doc, 'read');

    return doc;
  }

  async update(id, data) {
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
    const prepared = await this.req._prepare(this.modelName, allowedData, 'update', context);

    context.preparedData = prepared;
    Object.assign(doc, prepared);

    context.modifiedPaths = doc.modifiedPaths();
    doc = await this.req._transform(this.modelName, doc, 'update', context);
    context.modifiedPaths = doc.modifiedPaths();
    doc = await doc.save();
    doc = await this.req._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
    doc = await this.req._decorate(this.modelName, doc, 'update', context, true);

    return doc;
  }

  async delete(id) {
    let query = await this.req._genQuery(this.modelName, 'delete', await this.req._genIDQuery(this.modelName, id));
    if (query === false) return null;

    let doc = await this.model.findOneAndRemove(query);
    if (!doc) return null;

    return true;
  }

  async distinctQuery(field, options = {}) {
    let { query } = options as any;

    query = await this.req._genQuery(this.modelName, 'read', query);
    if (query === false) return null;

    const result = await this.model.distinct(field, query);
    if (!result) return null;

    return result;
  }
}

export default Controller;
