import mongoose from 'mongoose';
import JsonRouter from 'express-json-router';
import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import Model from './model';

import { setGenerators } from './generators';
import { setModelOptions } from './options';
import { ModelRouterProps } from './interfaces';

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

const defaultModelOptions = { listHardLimit: 1000, permissionField: '_permissions', identifier: '_id' };

class ModelRouter {
  modelName: string;
  options: ModelRouterProps;
  router: JsonRouter;
  model: Model;
  basename: string;

  constructor(modelName: string, options: ModelRouterProps) {
    this.modelName = modelName;
    this.options = { ...defaultModelOptions, ...options };

    setModelOptions(modelName, options);

    const { baseUrl } = this.options;

    this.router = new JsonRouter();
    this.model = new Model(modelName);

    if (baseUrl === false) {
      this.basename = '';
    } else if (isNil(baseUrl)) {
      this.basename = `/${pluralize(modelName)}`;
    } else {
      this.basename = baseUrl;
    }

    this.setCollectionRoutes();
    this.setDocumentRoutes();
  }

  ///////////////////////
  // Collection Routes //
  ///////////////////////
  setCollectionRoutes() {
    //////////
    // LIST //
    //////////
    this.router.get(`${this.basename}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { limit, page, include_permissions = 'true', include_count = 'false' } = req.query;

      const [query, select, pagination] = await Promise.all([
        req._genQuery(this.modelName, 'list'),
        req._genSelect(this.modelName, 'list'),
        req._genPagination({ limit, page }, this.options.listHardLimit),
      ]);

      if (query === false) return [];

      let docs = await this.model.find({ query, select, ...pagination });
      docs = await Promise.all(
        docs.map(async (doc) => {
          if (include_permissions !== 'false') doc = await req._permit(this.modelName, doc, 'list');
          return req._decorate(this.modelName, doc, 'list');
        }),
      );

      const rows = await req._decorateAll(this.modelName, docs, 'list');

      if (include_count === 'true') {
        return {
          count: await this.model.countDocuments(query),
          rows,
        };
      } else {
        return rows;
      }
    });

    //////////////////
    // LIST - QUERY //
    //////////////////
    this.router.post(`${this.basename}/__query`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { query, select, sort, populate, limit, page, options = {} } = req.body;
      const { includePermissions = true, includeCount = false, populateAccess = 'read' } = options;
      let pagination = null;

      [query, select, populate, pagination] = await Promise.all([
        req._genQuery(this.modelName, 'list', query),
        req._genSelect(this.modelName, 'list', select),
        req._genPopulate(this.modelName, populateAccess, populate),
        req._genPagination({ limit, page }, this.options.listHardLimit),
      ]);

      if (query === false) return [];

      // prevent populate paths from updating query select fields
      if (select) populate = populate.filter((p) => select.includes(p.path.split('.')[0]));
      let docs = await this.model.find({ query, select, sort, populate, ...pagination });
      docs = await Promise.all(
        docs.map(async (doc) => {
          if (includePermissions) doc = await req._permit(this.modelName, doc, 'list');
          return req._decorate(this.modelName, doc, 'list');
        }),
      );

      const rows = await req._decorateAll(this.modelName, docs, 'list');

      if (includeCount) {
        return {
          count: await this.model.countDocuments(query),
          rows,
        };
      } else {
        return rows;
      }
    });

    ////////////
    // CREATE //
    ////////////
    this.router.post(`${this.basename}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'create');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { include_permissions = 'true' } = req.query;
      const isArr = Array.isArray(req.body);
      let arr = isArr ? req.body : [req.body];

      const items = await Promise.all(
        arr.map(async (item) => {
          const allowedFields = await req._genCreatableFields(this.modelName, item);
          const allowedData = pick(item, allowedFields);
          return req._prepare(this.modelName, allowedData, item, 'create');
        }),
      );

      let docs = await this.model.create(items);
      docs = await Promise.all(
        docs.map(async (doc) => {
          if (include_permissions !== 'false') doc = await req._permit(this.modelName, doc, 'create');
          return req._decorate(this.modelName, doc, 'create');
        }),
      );

      res.status(201).json(isArr ? items : items[0]);
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.basename}/new`, setGenerators, async (req, res) => {
      return this.model.new();
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  setDocumentRoutes() {
    //////////
    // READ //
    //////////
    this.router.get(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      const { include_permissions = 'true', try_list = 'true' } = req.query;

      let [query, select] = await Promise.all([
        req._genQuery(this.modelName, 'read', await req._genIDQuery(this.modelName, id)),
        req._genSelect(this.modelName, 'read'),
      ]);

      if (query === false) return null;

      let doc = await this.model.findOne({ query, select });

      // if not found, try to get the doc with 'list' access
      if (!doc && try_list === 'true') {
        [query, select] = await Promise.all([
          req._genQuery(this.modelName, 'list', await req._genIDQuery(this.modelName, id)),
          req._genSelect(this.modelName, 'list'),
        ]);

        doc = await this.model.findOne({ query, select });
      }

      if (!doc) return null;

      if (include_permissions !== 'false') doc = await req._permit(this.modelName, doc, 'read');
      doc = await req._decorate(this.modelName, doc, 'read');

      return doc;
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    this.router.post(`${this.basename}/__query/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      let { select, populate, options = {} } = req.body;
      const { includePermissions = true, tryList = true, populateAccess = 'read' } = options;

      let query = null;
      [query, select, populate] = await Promise.all([
        req._genQuery(this.modelName, 'read', await req._genIDQuery(this.modelName, id)),
        req._genSelect(this.modelName, 'read', select),
        req._genPopulate(this.modelName, populateAccess, populate),
      ]);

      if (query === false) return null;

      let doc = await this.model.findOne({ query, select, populate });

      // if not found, try to get the doc with 'list' access
      if (!doc && tryList) {
        [query, select] = await Promise.all([
          req._genQuery(this.modelName, 'list', await req._genIDQuery(this.modelName, id)),
          req._genSelect(this.modelName, 'list', select),
        ]);

        doc = await this.model.findOne({ query, select, populate });
      }

      if (!doc) return null;

      if (includePermissions) doc = await req._permit(this.modelName, doc, 'read');
      doc = await req._decorate(this.modelName, doc, 'read');

      return doc;
    });

    ////////////
    // UPDATE //
    ////////////
    this.router.put(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      let query = await req._genQuery(this.modelName, 'update', await req._genIDQuery(this.modelName, id));
      if (query === false) return null;

      let doc = await this.model.findOne({ query });
      if (!doc) return null;

      doc._originalDoc = doc.toObject();
      doc._originalData = req.body;
      doc = await req._permit(this.modelName, doc, 'update');
      const allowedFields = await req._genEditableFields(this.modelName, doc);
      const allowedData = pick(req.body, allowedFields);
      const prepared = await req._prepare(this.modelName, allowedData, req.body, 'update', doc);

      doc._preparedData = prepared;
      Object.assign(doc, prepared);

      doc = await req._transform(this.modelName, doc, 'update');
      doc._modifiedPaths = doc.modifiedPaths();
      doc = await doc.save();
      doc = await req._decorate(this.modelName, doc, 'update', true);

      return doc;
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      let query = await req._genQuery(this.modelName, 'delete', await req._genIDQuery(this.modelName, id));
      if (query === false) return null;

      let doc = await this.model.findOneAndRemove(query);
      if (!doc) return null;

      return true;
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const query = await req._genQuery(this.modelName, 'read', {});
      if (query === false) return null;

      const result = await this.model.distinct(field, query);
      if (!result) return null;

      return result;
    });

    this.router.post(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      let { query } = req.body;
      query = await req._genQuery(this.modelName, 'read', query);
      if (query === false) return null;

      const result = await this.model.distinct(field, query);
      if (!result) return null;

      return result;
    });
  }

  get routes() {
    return this.router.original;
  }
}

export default ModelRouter;
